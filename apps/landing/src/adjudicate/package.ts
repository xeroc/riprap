// package.ts — wizard step 0 "package" (ADJUDICATION-DASHBOARD §4/§5): the
// juror's evidence package, verified before anything renders.
//
// Pipeline: GET /evidence/{dispute}/for/{juror} (the rounds index) → the
// routed round's delivered `out` bundle → the decryptDelivery seam
// (delivery.ts) → root gate `verifyManifestHash(bytes,
// Dispute.evidenceHashes[round])` → the riprap-claim/v1 parser → the
// subaccord/filer cross-checks.
//
// The manifest bytes come from JUROR DELIVERY ONLY (§5): the public manifest
// endpoint (daemon SPEC.md:386, SDK fetchManifest) is unauthenticated and is
// never on the juror path — root-gating bytes a server chose would prove
// nothing about what the claimant filed.
//
// Fails closed (§5): verification is a precondition, never a warning — any
// mismatch is terminal "do not vote". Round-incomplete (409 / `complete:
// false`) and a not-yet-delivered round are honest pending states (jurors
// never see half a case) — retried, never rendered as errors. A zero-slot
// round (all-zero evidence hash) is the no-evidence state, not a failure.
//
// Plaintext manifest bytes live in memory only (§6/§8): returned, never
// persisted.

import type { Address, ReadonlyUint8Array } from "@solana/kit";
import { verifyManifestHash } from "@useaccord/sdk/evidence";

import { CLAIM_DOCUMENT_PATHS, type ClaimManifestInput } from "../app/file-claim/manifest";
import { type DecryptDelivery, errorText } from "./delivery";

/** The daemon's per-file status vocabulary (SPEC §HTTP API v2). */
export type RoundFileStatus = "stored" | "pending" | "out_of_band";

export interface RoundIndexFile {
  path: string;
  status: RoundFileStatus;
}

/** One round's index entry (ADR-0023 per-round delivery, v2 read-derived
 * fields): the juror-encrypted manifest bundle + per-file statuses. */
export interface RoundIndexEntry {
  round: number;
  /** AES-GCM(k_out, manifest bytes), nonce(12) prepended — base64. */
  out: string;
  /** Operator's ephemeral X25519 public key for this delivery (32B) — base64. */
  operator_ephem_pub: string;
  files: RoundIndexFile[];
  complete: boolean;
}

/** GET /evidence/{dispute}/for/{juror} → every non-zero evidence_hashes
 * slot's package deliverable to this juror (daemon SPEC §HTTP API). */
export interface RoundsIndex {
  rounds: RoundIndexEntry[];
}

// Validation twins of ../app/file-claim/manifest.ts — the layout is one law
// (CLAIM-WIZARD §5 "exact bytes, no canonicalization"); the golden
// round-trip test keeps the pair in sync.
const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const SHA256_HEX = /^[0-9a-f]{64}$/;
const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/** Inverse of the builder's dq() (manifest.ts) — the only two free-text
 * scalars carry its escapes; anything else fails closed. */
function unescapeDq(value: string): string {
  let out = "";
  for (let i = 0; i < value.length; i++) {
    const ch = value[i] as string;
    if (ch === "\\") {
      const esc = value[++i];
      if (esc === undefined || !["\\", '"', "n", "r", "t"].includes(esc)) {
        throw new TypeError(`manifest: unknown escape in free text: \\${esc ?? ""}`);
      }
      out += esc === "n" ? "\n" : esc === "r" ? "\r" : esc === "t" ? "\t" : esc;
      continue;
    }
    if (/\p{Cc}/u.test(ch)) {
      throw new TypeError("manifest: control character in free text");
    }
    out += ch;
  }
  return out;
}

/** Strict line cursor over the pinned §5 layout: every line must match its
 * grammar, in order, with nothing left over — no lenient YAML. */
class ManifestCursor {
  private i = 0;

  constructor(private readonly lines: string[]) {}

  next(): string {
    const line = this.lines[this.i++];
    if (line === undefined) throw new TypeError("manifest: ended early");
    return line;
  }

  expect(line: string): void {
    const got = this.next();
    if (got !== line) {
      throw new TypeError(`manifest: expected ${JSON.stringify(line)}, got ${JSON.stringify(got)}`);
    }
  }

  scalar(name: string, valid: RegExp, indent = ""): string {
    const line = this.next();
    const value = new RegExp(`^${indent}${name}: (.+)$`).exec(line)?.[1];
    if (value === undefined || !valid.test(value)) {
      throw new TypeError(`manifest: bad ${name} line: ${JSON.stringify(line)}`);
    }
    return value;
  }

  quoted(name: string, indent = ""): string {
    const line = this.next();
    const value = new RegExp(`^${indent}${name}: "(.*)"$`).exec(line)?.[1];
    if (value === undefined) {
      throw new TypeError(`manifest: bad ${name} line: ${JSON.stringify(line)}`);
    }
    return unescapeDq(value);
  }

  done(): void {
    if (this.i !== this.lines.length) {
      throw new TypeError(
        `manifest: unexpected trailing line: ${JSON.stringify(this.lines[this.i] ?? "")}`,
      );
    }
  }
}

/**
 * Parse `riprap-claim/v1` manifest bytes (CLAIM-WIZARD §5) into the same
 * shape the claimant builder serializes — the parser and the builder agree
 * on every field by construction (byte-exact round-trip, pinned by the
 * golden test). The landing owns this parser: the SDK's `parseManifest`
 * targets `accord-evidence/v1`. Throws on anything that is not exactly the
 * profile — wrong schema, malformed line, bad base58/ISO/hex, non-canonical
 * entry paths, a non-fixed options block, non-UTF-8 bytes.
 */
export function parseClaimManifest(bytes: Uint8Array): ClaimManifestInput {
  const text = new TextDecoder("utf-8", { fatal: true }).decode(bytes);
  const lines = text.split("\n");
  if (lines[lines.length - 1] !== "") {
    throw new TypeError("manifest: must end with a trailing newline (format §2 exact bytes)");
  }
  lines.pop();
  const c = new ManifestCursor(lines);

  c.expect("schema: riprap-claim/v1");
  const subaccord = c.scalar("subaccord", BASE58);
  const filer = c.scalar("filer", BASE58);
  const mutual = c.scalar("mutual", BASE58);
  const member = c.scalar("member", BASE58);
  const filedAt = c.scalar("filed_at", ISO_UTC);
  const language = c.scalar("language", /^[a-z]{2}(-[A-Za-z0-9]{2,8})?$/);
  const title = c.quoted("title");
  c.expect("claim_context:");
  const incidentAt = c.scalar("incident_at", ISO_UTC, "  ");
  const incidentPlace = c.quoted("incident_place", "  ");
  const requestedAmountUsdc = BigInt(c.scalar("requested_amount_usdc", /^\d+$/, "  "));
  const tier = c.scalar("tier", /^\S+$/, "  ");
  const contributionUsdc = BigInt(c.scalar("contribution_usdc", /^\d+$/, "  "));
  // The fixed hanse option block (spec §5 / CLAIM-WIZARD §5): recipe
  // hanse-opt/v1, labels Approve/Deny — no filer salt exists to vary it.
  c.expect('options: { recipe: hanse-opt/v1, labels: ["Approve", "Deny"] }');
  c.expect("entries:");
  const entries = CLAIM_DOCUMENT_PATHS.map((path) => {
    const line = c.next();
    const match = /^[ ]{2}- \{ path: (.+), sha256: "(.*)" \}$/.exec(line);
    const entryPath = match?.[1];
    const sha256 = match?.[2];
    if (entryPath !== path || sha256 === undefined || !SHA256_HEX.test(sha256)) {
      throw new TypeError(`manifest: bad entry for ${path}: ${JSON.stringify(line)}`);
    }
    return { path, sha256 };
  });
  c.done();

  return {
    subaccord,
    filer,
    mutual,
    member,
    filedAt,
    language,
    title,
    claimContext: { incidentAt, incidentPlace, requestedAmountUsdc, tier, contributionUsdc },
    entries,
  };
}

/** Step 0's states (§4/§5): `verified` opens the wizard; `pending` is the
 * honest retryable state; `failed` is terminal — the do-not-vote state;
 * `no-evidence` is the zero-slot round (§5). */
export type PackageVerification =
  | { state: "no-evidence" }
  | { state: "pending"; reason: string }
  | { state: "failed"; reason: string }
  | {
      state: "verified";
      /** The exact manifest bytes — memory only (§6/§8). */
      bytes: Uint8Array;
      manifest: ClaimManifestInput;
      /** The index's read-derived per-file statuses (informational). */
      files: RoundIndexFile[];
    };

/**
 * Fetch and verify the routed round's evidence package for a drawn juror:
 * rounds index → delivered `out` bundle → decrypt seam → root gate →
 * parser → cross-checks. The status vocabulary mirrors delivery.ts (the
 * same daemon, the same refusal mapping): transport/5xx and round-incomplete
 * are pending; every other refusal, decrypt failure, root/parse/cross-check
 * mismatch is a terminal fail.
 */
export async function fetchJurorPackage(params: {
  /** Evidence-daemon base URL (the operator the mutual resolves to). */
  endpoint: string;
  dispute: string;
  juror: string;
  round: number;
  /** `Dispute.evidenceHashes[round]` — the on-chain root (caller's chain read). */
  evidenceHash: ReadonlyUint8Array | undefined;
  /** Cross-check inputs (§5): the mutual's subaccord + the mutual PDA. */
  subaccord: Address;
  mutual: Address;
  decrypt: DecryptDelivery;
}): Promise<PackageVerification> {
  const root = params.evidenceHash;
  if (root === undefined || root.every((b) => b === 0)) {
    return { state: "no-evidence" };
  }

  const base = params.endpoint.replace(/\/+$/, "");
  const url = `${base}/evidence/${encodeURIComponent(params.dispute)}/for/${encodeURIComponent(
    params.juror,
  )}`;

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

  let index: RoundsIndex;
  try {
    index = (await res.json()) as RoundsIndex;
  } catch {
    return { state: "failed", reason: "malformed rounds index (not JSON)" };
  }
  if (!Array.isArray(index.rounds)) {
    return { state: "failed", reason: "malformed rounds index (no rounds array)" };
  }
  const entry = index.rounds.find((r) => r.round === params.round);
  if (entry === undefined) {
    // Non-zero chain slot but no operator package: the claim stands while
    // delivery retries (CLAIM-WIZARD §6) — honest pending, never an error.
    return { state: "pending", reason: "round package not delivered yet" };
  }
  if (!entry.complete) {
    return { state: "pending", reason: "round incomplete — jurors never see half a case" };
  }

  let bytes: Uint8Array;
  try {
    bytes = await params.decrypt({ out: entry.out, operator_ephem_pub: entry.operator_ephem_pub });
  } catch (err) {
    return { state: "failed", reason: `manifest undecryptable: ${String(err)}` };
  }

  try {
    await verifyManifestHash(bytes, new Uint8Array(root));
  } catch {
    return {
      state: "failed",
      reason: "root gate failed: sha256(manifest) != Dispute.evidence_hashes[round]",
    };
  }

  let manifest: ClaimManifestInput;
  try {
    manifest = parseClaimManifest(bytes);
  } catch (err) {
    return { state: "failed", reason: `manifest unparseable: ${String(err)}` };
  }

  if (manifest.subaccord !== params.subaccord) {
    return {
      state: "failed",
      reason: `cross-check failed: manifest subaccord ${manifest.subaccord} != mutual subaccord ${params.subaccord}`,
    };
  }
  if (manifest.filer !== params.mutual) {
    return {
      state: "failed",
      reason: `cross-check failed: manifest filer ${manifest.filer} != mutual PDA ${params.mutual}`,
    };
  }
  return { state: "verified", bytes, manifest, files: entry.files ?? [] };
}
