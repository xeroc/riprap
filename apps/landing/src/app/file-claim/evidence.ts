// evidence.ts — the wizard's ADR-0031 loose per-file transport client:
// POST the manifest bundle to round 0, then PUT each document as its own
// ECIES bundle (independent DEKs, per-file retry). Crypto is single-sourced
// from `@useaccord/sdk/evidence` (claimantEncrypt); the HTTP shape is the
// daemon's documented contract (SPEC.md §HTTP API):
//   POST /evidence/{subaccord}/{dispute}/0          → 201 (409 = hash clash)
//   PUT  /evidence/{subaccord}/{dispute}/0/{path}   → 201 idempotent
//     404 = manifest-first violated · 400 = untracked path / leaf mismatch
//     409 = a DIFFERENT hash is stored (hard stop) · 413 = over caps
// All five 201s ⇒ derived-complete (ADR-0031).
import { type Address, getAddressEncoder } from "@solana/kit";
import { claimantEncrypt, type IngestBundle } from "@useaccord/sdk/evidence";

/** Per-file retry: transient failures get this many attempts. */
export const PUT_ATTEMPTS = 3;

function toBase64(bytes: Uint8Array): string {
  return btoa(String.fromCharCode(...bytes));
}

async function bundleJson(plaintext: Uint8Array, operatorPub: Uint8Array): Promise<string> {
  const bundle: IngestBundle = await claimantEncrypt(plaintext, operatorPub);
  return JSON.stringify({
    ct: toBase64(bundle.ct),
    claimant_ephem_pub: toBase64(bundle.claimant_ephem_pub),
    wrapped: toBase64(bundle.wrapped),
    plaintext_hash: toBase64(bundle.plaintext_hash),
  });
}

function base(endpoint: string): string {
  return endpoint.replace(/\/+$/, "");
}

async function bodyText(res: Response): Promise<string> {
  return await res.text().catch(() => "");
}

/**
 * POST the manifest bundle (round 0). Idempotent: the same plaintext_hash
 * re-POSTs as a 201 no-op. A 409 means a different manifest is already
 * stored for this dispute — surfaced, never retried.
 */
export async function postManifest(params: {
  endpoint: string;
  subaccord: string;
  dispute: string;
  manifest: Uint8Array;
  operatorPub: Uint8Array;
}): Promise<"posted" | "conflict"> {
  const { endpoint, subaccord, dispute, manifest, operatorPub } = params;
  const res = await fetch(`${base(endpoint)}/evidence/${subaccord}/${dispute}/0`, {
    method: "POST",
    headers: { "content-type": "application/json" },
    body: await bundleJson(manifest, operatorPub),
  });
  if (res.status === 201) return "posted";
  if (res.status === 409) return "conflict";
  throw new Error(`evidence manifest post failed: ${res.status} ${await bodyText(res)}`);
}

/**
 * PUT one document (independent ECIES). Retries transient failures
 * (network / 5xx) up to PUT_ATTEMPTS; 409 is terminal — a different file is
 * stored under this path and nothing was overwritten.
 */
export async function putDocument(params: {
  endpoint: string;
  subaccord: string;
  dispute: string;
  path: string;
  bytes: Uint8Array;
  operatorPub: Uint8Array;
}): Promise<"delivered" | "conflict"> {
  const { endpoint, subaccord, dispute, path, bytes, operatorPub } = params;
  const body = await bundleJson(bytes, operatorPub);
  let lastError = "unknown error";
  for (let attempt = 1; attempt <= PUT_ATTEMPTS; attempt++) {
    try {
      const res = await fetch(`${base(endpoint)}/evidence/${subaccord}/${dispute}/0/${path}`, {
        method: "PUT",
        headers: { "content-type": "application/json" },
        body,
      });
      if (res.status === 201) return "delivered";
      if (res.status === 409) return "conflict";
      if (res.status >= 500 && attempt < PUT_ATTEMPTS) {
        lastError = `${res.status}`;
        continue;
      }
      throw new Error(`evidence put ${path} failed: ${res.status} ${await bodyText(res)}`);
    } catch (error) {
      lastError = error instanceof Error ? error.message : "network error";
      if (attempt < PUT_ATTEMPTS) continue;
    }
  }
  throw new Error(`evidence put ${path} failed after ${PUT_ATTEMPTS} attempts: ${lastError}`);
}

/**
 * The operator's stored `encryption_key` as raw 32 bytes — the metadata JSON
 * carries it as 64-char hex or base58 (both appear in the wild; the daemon's
 * /config discloses the same two encodings).
 */
export function operatorPubFromKey(key: string): Uint8Array {
  if (/^[0-9a-fA-F]{64}$/.test(key)) {
    const out = new Uint8Array(32);
    for (let i = 0; i < 32; i++) {
      out[i] = Number.parseInt(key.slice(i * 2, i * 2 + 2), 16);
    }
    return out;
  }
  // base58 pubkey — the address encoder yields its 32 bytes
  return new Uint8Array(getAddressEncoder().encode(key as Address));
}
