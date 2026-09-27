// delivery.ts — juror per-file evidence delivery (ADJUDICATION-DASHBOARD §5):
// one document per GET `/evidence/{dispute}/for/{juror}/{round}/{path}`
// (evidence-daemon SPEC §HTTP API, v2 per-file delivery) → the decryptDelivery
// seam → the leaf gate → a per-document state.
//
// Fails closed (§5): verification is a precondition, never a warning. The
// wizard decrypts ONLY through the `DecryptDelivery` seam — the delivery key
// is a browser-local X25519 key registered through a founder-provided
// interface that is EXTERNAL and PENDING (§9); step 0 gates on the key's
// presence with an honest no-delivery-key state until it lands.
//
// Plaintext bytes live in memory only (§6/§8): this module returns them and
// persists nothing — the viewer makes blob URLs and revokes them on exit.

import {
  aesGcmDecrypt,
  DELIVER_INFO,
  hkdfSha256,
  sha256,
  x25519SharedSecret,
} from "@useaccord/sdk/evidence";

/** The daemon's delivered bundle, as JSON on the wire (base64 fields). */
export interface DeliveredDocumentBundle {
  /** AES-GCM(k_out, plaintext), nonce(12) prepended — base64. */
  out: string;
  /** Operator's ephemeral X25519 public key for this delivery (32B) — base64. */
  operator_ephem_pub: string;
}

/** A manifest document entry, structurally: the leaf gate needs only the
 * path (identity) and the claimed hash. `sha256` is absent for URL-path
 * entries; the all-zero sentinel marks a skipped slot — both skip the gate. */
export interface DocumentEntry {
  path: string;
  sha256?: string;
}

/**
 * Delivery-key custody (spec §5): the founder-provided registration interface
 * writes the juror's browser-local delivery key through this seam. One active
 * key per juror, last-writer-wins (daemon ADR-0034); the raw 32-byte X25519
 * secret never leaves the browser.
 */
export interface DeliveryKeyStore {
  /** The 32-byte X25519 delivery secret, or null when this browser holds none. */
  get(): Uint8Array | null;
  put(secret: Uint8Array): void;
  clear(): void;
}

const STORAGE_KEY = "riprap.adjudicate.delivery-key";

function fromBase64(value: string): Uint8Array {
  const bin = atob(value);
  const bytes = new Uint8Array(bin.length);
  for (let i = 0; i < bin.length; i++) {
    bytes[i] = bin.charCodeAt(i);
  }
  return bytes;
}

/** The default custody seam: origin-scoped localStorage, base64-encoded. */
export function localDeliveryKeyStore(storage: Storage = localStorage): DeliveryKeyStore {
  return {
    get() {
      const raw = storage.getItem(STORAGE_KEY);
      if (raw === null) {
        return null;
      }
      const secret = fromBase64(raw);
      return secret.length === 32 ? secret : null;
    },
    put(secret) {
      storage.setItem(STORAGE_KEY, btoa(String.fromCharCode(...secret)));
    },
    clear() {
      storage.removeItem(STORAGE_KEY);
    },
  };
}

/**
 * The decrypt seam (spec §5): `decryptDelivery(bundle) → bytes`. Strict-mode
 * delivery (daemon ADR-0034) re-encrypts to the juror's registered native
 * X25519 delivery key with the unchanged construction and HKDF label —
 * shared = X25519(delivery secret, operator_ephem_pub), k_out =
 * HKDF-SHA256(shared, "accord-deliver-v1"), plaintext = AES-GCM(k_out, out).
 * Throws on auth failure (wrong/stale key or tampered bundle).
 */
export type DecryptDelivery = (bundle: DeliveredDocumentBundle) => Promise<Uint8Array>;

/** The seam implementation over a browser delivery key. */
export function deliveryKeyDecrypt(secret: Uint8Array): DecryptDelivery {
  return async (bundle) => {
    const shared = x25519SharedSecret(secret, fromBase64(bundle.operator_ephem_pub));
    const kOut = await hkdfSha256(shared, new TextEncoder().encode(DELIVER_INFO));
    return await aesGcmDecrypt(kOut, fromBase64(bundle.out));
  };
}

/**
 * Step 0's key-presence gate (spec §5/§9): the decrypt seam for this browser,
 * or null when no delivery key is registered — the honest no-delivery-key
 * state. Evidence never decrypts, let alone renders, without a key.
 */
export function currentDecryptDelivery(store: DeliveryKeyStore): DecryptDelivery | null {
  const secret = store.get();
  return secret === null ? null : deliveryKeyDecrypt(secret);
}

/** The all-zero sha256 sentinel — a skipped round slot (per-round delivery,
 * daemon ADR-0023): born satisfied, never fetched. */
export const ZERO_SHA256 = "0".repeat(64);

/**
 * The leaf gate (spec §5): `sha256(bytes) == entry.sha256`, lowercase hex,
 * composed in-app — no packaged SDK helper exists. URL-path entries (no
 * `sha256`) and all-zero sentinels skip the check (born satisfied); riprap
 * claims always carry real leaves, but the gate handles them anyway.
 */
export async function verifyLeaf(bytes: Uint8Array, entry: DocumentEntry): Promise<boolean> {
  if (entry.sha256 === undefined || entry.sha256 === ZERO_SHA256) {
    return true;
  }
  const digest = await sha256(bytes);
  const hex = Array.from(digest, (b) => b.toString(16).padStart(2, "0")).join("");
  return hex === entry.sha256.toLowerCase();
}

/** Per-document verification states (spec §5): `verified` / `pending` /
 * `failed` — failed is terminal ("do not vote", §4); pending is the honest
 * round-incomplete state, retried — never rendered as an error. */
export type DocumentVerification =
  | { state: "verified"; bytes: Uint8Array }
  | { state: "pending"; reason: string }
  | { state: "failed"; reason: string };

/** The daemon's refusal reason (JSON `error` field) or `HTTP <status>` —
 * shared by every adjudicate fetch against the daemon. */
export async function errorText(res: Response): Promise<string> {
  const body = await res.json().catch(() => null);
  return (body !== null && typeof body.error === "string" && body.error) || `HTTP ${res.status}`;
}

/**
 * Fetch one document for a drawn juror and run it through the whole gate:
 * GET → decrypt (seam only) → leaf gate.
 *
 * Status mapping (daemon per-file contract): 200 → gates; `409` whose reason
 * carries "incomplete" (the daemon's round-incomplete vocabulary — the only
 * retryable refusal; jurors never see half a case) → pending; every other
 * refusal (404 not-drawn/untracked, 409 tamper/leaf-gate, 4xx) → failed,
 * fails closed; transport-level failures (offline, 5xx) → pending — the
 * caller retries, nothing is ruled out.
 */
export async function fetchJurorDocument(params: {
  /** Evidence-daemon base URL (the operator the mutual resolves to). */
  endpoint: string;
  dispute: string;
  juror: string;
  round: number;
  path: string;
  decrypt: DecryptDelivery;
  entry: DocumentEntry;
}): Promise<DocumentVerification> {
  const base = params.endpoint.replace(/\/+$/, "");
  const url = `${base}/evidence/${encodeURIComponent(params.dispute)}/for/${encodeURIComponent(
    params.juror,
  )}/${params.round}/${params.path.split("/").map(encodeURIComponent).join("/")}`;

  let res: Response;
  try {
    res = await fetch(url);
  } catch (err) {
    return { state: "pending", reason: `evidence daemon unreachable: ${String(err)}` };
  }

  if (!res.ok) {
    const reason = await errorText(res);
    if (res.status >= 500) {
      return { state: "pending", reason };
    }
    if (res.status === 409 && reason.includes("incomplete")) {
      return { state: "pending", reason };
    }
    return { state: "failed", reason };
  }

  const bundle = (await res.json()) as DeliveredDocumentBundle;
  let bytes: Uint8Array;
  try {
    bytes = await params.decrypt(bundle);
  } catch (err) {
    return { state: "failed", reason: `delivery undecryptable: ${String(err)}` };
  }
  if (!(await verifyLeaf(bytes, params.entry))) {
    return { state: "failed", reason: "leaf gate failed: sha256(document) != manifest entry" };
  }
  return { state: "verified", bytes };
}
