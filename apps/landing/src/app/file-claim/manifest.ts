// riprap-claim/v1 — the payout-request evidence manifest (CLAIM-WIZARD §5).
// One serialization feeds the preview, the on-chain evidence hash, and the
// encrypted upload — callers get the exact buffer + its sha256 together and
// never re-serialize. Exact bytes, no canonicalization (daemon format §2):
// the layout below is law, pinned by the manifest suite — key order, quoting,
// flow maps, and the trailing newline are all part of the hash.
//
// Pure module: no chain, no React — also the recovery path's verifier input.

/** The five policy §7 proof documents, in policy order (CLAIM-WIZARD §4 step 3). */
export const CLAIM_DOCUMENT_PATHS = [
  "01-ticket.pdf",
  "02-id-document.jpg",
  "03-police-report.pdf",
  "04-medical-report.pdf",
  "05-statutory-declaration.pdf",
] as const;

export type ClaimDocumentPath = (typeof CLAIM_DOCUMENT_PATHS)[number];

/** One evidence entry: a canonical path + the client sha256 of the exact
 * uploaded bytes (hex, lower-case). */
export interface ClaimManifestEntry {
  path: ClaimDocumentPath;
  sha256: string;
}

/** Claimant-declared context (CLAIM-WIZARD §5 `claim_context`): informative —
 * the authoritative tier/contribution/treasury are the public chain accounts.
 * Amounts are raw 6-dp micro-USDC integers ($2,000 = 2_000_000_000n). */
export interface ClaimContext {
  incidentAt: string; // ISO 8601 UTC, 2026-11-15T18:05:00Z
  incidentPlace: string; // free text, e.g. the venue corridor
  requestedAmountUsdc: bigint;
  tier: string; // Basic · Standard · Premium (policy §5)
  contributionUsdc: bigint;
}

/** Everything the manifest carries; addresses are base58 strings. */
export interface ClaimManifestInput {
  dispute: string;
  subaccord: string;
  filer: string; // the mutual PDA
  mutual: string;
  member: string;
  claim: string; // the Claim PDA
  filedAt: string; // ISO 8601 UTC
  title: string; // e.g. "Payout request — knife assault, 2026-11-15"
  language?: string; // fixed "en" unless the caller says otherwise
  claimContext: ClaimContext;
  entries: ClaimManifestEntry[]; // exactly the five canonical paths, in order
}

/** The serialized manifest + the hash that goes on-chain
 * (`evidence_hash = sha256(utf8(manifest.yaml))` — exact bytes). */
export interface BuiltClaimManifest {
  yaml: string;
  sha256Hex: string;
}

const ISO_UTC = /^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}Z$/;
const SHA256_HEX = /^[0-9a-f]{64}$/;
const BASE58 = /^[1-9A-HJ-NP-Za-km-z]{32,44}$/;

/** YAML double-quote style for free text (title, place): the only two scalars
 * a member types. Raw UTF-8 passes through; specials and controls escape. */
function dq(value: string): string {
  const escaped = value
    .replace(/\\/g, "\\\\")
    .replace(/"/g, '\\"')
    .replace(/\n/g, "\\n")
    .replace(/\r/g, "\\r")
    .replace(/\t/g, "\\t");
  if (/\p{Cc}/u.test(escaped)) {
    throw new TypeError("manifest: control characters are not allowed in free text");
  }
  return `"${escaped}"`;
}

function address(field: string, value: string): string {
  if (!BASE58.test(value)) throw new TypeError(`manifest: ${field} is not a base58 address`);
  return value;
}

function iso(field: string, value: string): string {
  if (!ISO_UTC.test(value)) {
    throw new TypeError(`manifest: ${field} must be ISO 8601 UTC (…T…Z), got ${value}`);
  }
  return value;
}

/** Serialize to the exact §5 layout. Pure and deterministic: same input,
 * same bytes — the on-chain hash must reproduce months later (recovery). */
export function serializeClaimManifest(input: ClaimManifestInput): string {
  const { claimContext: ctx } = input;

  const paths = input.entries.map((e) => e.path);
  const canonical = CLAIM_DOCUMENT_PATHS as readonly string[];
  if (paths.length !== canonical.length || paths.some((p, i) => p !== canonical[i])) {
    throw new TypeError(
      "manifest: entries must be exactly the five canonical policy §7 paths, in order",
    );
  }
  for (const e of input.entries) {
    if (!SHA256_HEX.test(e.sha256)) {
      throw new TypeError(`manifest: ${e.path} needs a 64-hex lower-case sha256`);
    }
  }

  const lines = [
    "schema: riprap-claim/v1",
    `dispute: ${address("dispute", input.dispute)}`,
    `subaccord: ${address("subaccord", input.subaccord)}`,
    `filer: ${address("filer", input.filer)}`,
    `mutual: ${address("mutual", input.mutual)}`,
    `member: ${address("member", input.member)}`,
    `claim: ${address("claim", input.claim)}`,
    `filed_at: ${iso("filed_at", input.filedAt)}`,
    `language: ${input.language ?? "en"}`,
    `title: ${dq(input.title)}`,
    "claim_context:",
    `  incident_at: ${iso("claim_context.incident_at", ctx.incidentAt)}`,
    `  incident_place: ${dq(ctx.incidentPlace)}`,
    `  requested_amount_usdc: ${ctx.requestedAmountUsdc}`,
    `  tier: ${ctx.tier}`,
    `  contribution_usdc: ${ctx.contributionUsdc}`,
    'options: { recipe: hanse-opt/v1, labels: ["Approve", "Deny"] }',
    "entries:",
    ...input.entries.map((e) => `  - { path: ${e.path}, sha256: "${e.sha256}" }`),
  ];
  return `${lines.join("\n")}\n`;
}

/** sha256(bytes) → 64 lower-case hex. WebCrypto (native, no dependency);
 * same primitive hashes the uploaded documents in the evidence step. */
export async function sha256Hex(bytes: Uint8Array<ArrayBuffer>): Promise<string> {
  const digest = await globalThis.crypto.subtle.digest("SHA-256", bytes);
  const view = new Uint8Array(digest);
  let hex = "";
  for (const b of view) hex += b.toString(16).padStart(2, "0");
  return hex;
}

/** Build the manifest: one serialization yields both the buffer and its
 * on-chain hash — never re-serialize (CLAIM-WIZARD §5). */
export async function buildClaimManifest(input: ClaimManifestInput): Promise<BuiltClaimManifest> {
  const yaml = serializeClaimManifest(input);
  return { yaml, sha256Hex: await sha256Hex(new TextEncoder().encode(yaml)) };
}
