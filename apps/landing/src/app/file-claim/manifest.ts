// manifest.ts — the `riprap-claim/v1` evidence manifest (CLAIM-WIZARD §5):
// a deterministic YAML serialization whose EXACT utf8 bytes are hashed
// (evidence_hash = sha256(manifest.yaml) — EVENT-MUTUAL §7 amendment) and
// one buffer feeds preview, hash, and (later) encryption — never
// re-serialized. Options carry the fixed hanse mapping (recipe
// hanse-opt/v1, Approve = 0 / Deny = 1 — programs/hanse option_label);
// claim_context values are claimant-declared and informative; the
// authoritative tier/contribution are the public chain accounts.

import type { Address } from "@solana/kit";
import { sha256Hex } from "./documents";
import { DOC_SLOTS } from "./draft";

export const MANIFEST_SCHEMA = "riprap-claim/v1";
export const OPTION_RECIPE = "hanse-opt/v1";
export const OPTION_LABELS = ["Approve", "Deny"] as const;

/** The manifest leaf set, in canonical policy §7 order. */
export function manifestEntries(
  docs: Readonly<Partial<Record<string, { sha256: string }>>>,
): Array<{ path: string; sha256: string }> {
  return DOC_SLOTS.filter((slot) => docs[slot.path] !== undefined).map((slot) => ({
    path: slot.path,
    sha256: docs[slot.path]?.sha256 ?? "",
  }));
}
export interface ManifestInput {
  dispute: Address;
  subaccord: Address;
  /** The mutual PDA — the on-chain filer (§5: `filer`). */
  mutual: Address;
  member: Address;
  claim: Address;
  filedAt: Date;
  incidentAt: Date;
  incidentPlace: string;
  /** 6-dp USDC (micro), exactly what the member signed in step 2. */
  requestedAmountUsdc: bigint;
  tier: string;
  /** The member tier's on-chain contribution (micro) — mutual.tiers. */
  contributionUsdc: bigint;
  entries: ReadonlyArray<{ path: string; sha256: string }>;
}

/** Date → `2026-11-15T18:05:00Z` (seconds precision, Z). */
function isoSeconds(date: Date): string {
  return `${date.toISOString().slice(0, 19)}Z`;
}

/** Date → `2026-11-15` (UTC calendar date of the incident). */
function isoDate(date: Date): string {
  return date.toISOString().slice(0, 10);
}

/** YAML double-quoted scalar — escapes the two characters YAML cares about. */
function quoted(value: string): string {
  return `"${value.replace(/\\/g, "\\\\").replace(/"/g, '\\"')}"`;
}

/**
 * Deterministic serialization — field order fixed by CLAIM-WIZARD §5, the
 * byte-stability contract for tests and the on-chain evidence hash.
 */
export function serializeManifest(input: ManifestInput): string {
  const lines = [
    `schema: ${MANIFEST_SCHEMA}`,
    `dispute: ${input.dispute}`,
    `subaccord: ${input.subaccord}`,
    `filer: ${input.mutual}`,
    `mutual: ${input.mutual}`,
    `member: ${input.member}`,
    `claim: ${input.claim}`,
    `filed_at: ${isoSeconds(input.filedAt)}`,
    "language: en",
    `title: ${quoted(`Payout request — knife assault, ${isoDate(input.incidentAt)}`)}`,
    "claim_context:",
    `  incident_at: ${isoSeconds(input.incidentAt)}`,
    `  incident_place: ${quoted(input.incidentPlace)}`,
    `  requested_amount_usdc: ${input.requestedAmountUsdc}`,
    `  tier: ${input.tier}`,
    `  contribution_usdc: ${input.contributionUsdc}`,
    `options: { recipe: ${OPTION_RECIPE}, labels: [${OPTION_LABELS.map(quoted).join(", ")}] }`,
    "entries:",
    ...input.entries.map((e) => `  - { path: ${e.path}, sha256: ${e.sha256} }`),
  ];
  return `${lines.join("\n")}\n`;
}

export interface BuiltManifest {
  /** manifest.yaml — the exact bytes that hash, preview, and encrypt. */
  yaml: string;
  /** evidence_hash = sha256(utf8(yaml)) — goes on-chain verbatim (§7). */
  sha256: string;
}

/** Serialize once and hash the same buffer — never a second serialization. */
export async function buildManifest(input: ManifestInput): Promise<BuiltManifest> {
  const yaml = serializeManifest(input);
  const bytes = new TextEncoder().encode(yaml);
  return { yaml, sha256: await sha256Hex(bytes) };
}
