/**
 * Pure argument parsing + fee math for `hanse:*` commands. No I/O, no chain —
 * unit-testable (pool-args.ts precedent).
 */
import type { SubaccordParamArgs } from "@riprap/hanse";

import { toBigInt } from "./pool-args";

/** Cover-tier names as accepted on the command line; index = Mutual.tiers slot. */
export const TIER_OPTIONS = ["basic", "standard", "premium"] as const;

/** `--tier basic` → 0 (Basic), `standard` → 1, `premium` → 2 (EVENT-MUTUAL §6). */
export function tierIndexFromName(name: string): number {
  const idx = TIER_OPTIONS.indexOf(name as (typeof TIER_OPTIONS)[number]);
  if (idx < 0) {
    throw new Error(`Unknown tier "${name}" (expected basic, standard, or premium).`);
  }
  return idx;
}

/**
 * Parse one `--tier contribution:max-payout` spec (u64:u64, raw units).
 * Order of the three `--tier` flags = Basic/Standard/Premium.
 */
export function parseTierSpec(raw: string): { contribution: bigint; maxPayout: bigint } {
  const parts = raw.split(":");
  if (parts.length !== 2) {
    throw new Error(
      `Invalid tier "${raw}" — expected contribution:max-payout (e.g. 10000000:1000000000).`,
    );
  }
  return {
    contribution: toBigInt("tier contribution", parts[0], 64),
    maxPayout: toBigInt("tier max-payout", parts[1], 64),
  };
}

/** 64-char hex → 32 bytes (policy hash, evidence hash). Throws on mismatch. */
export function hexToBytes32(label: string, raw: string): Uint8Array {
  if (!/^[0-9a-fA-F]{64}$/.test(raw)) {
    throw new Error(`Invalid ${label}: expected 64 hex chars (32 bytes), got ${raw.length} chars.`);
  }
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) out[i] = Number.parseInt(raw.slice(i * 2, i * 2 + 2), 16);
  return out;
}

/**
 * Filing fee = min_jury_size × fee_per_juror (EVENT-MUTUAL §2.6; §12 pilot:
 * 3 × 5 USDC = 15 USDC). u64-checked — the program re-verifies, this exists
 * so the CLI can PRINT the fee before sending.
 */
export function juryFee(minJurySize: number, feePerJuror: bigint): bigint {
  if (!Number.isInteger(minJurySize) || minJurySize <= 0) {
    throw new Error(`min_jury_size must be a positive integer (got ${minJurySize}).`);
  }
  const fee = BigInt(minJurySize) * feePerJuror;
  if (fee >= 1n << 64n) {
    throw new Error(`jury fee overflows u64 (${minJurySize} × ${feePerJuror}).`);
  }
  return fee;
}

/** Kinds set_subaccord_param exposes (set_subaccord_param.rs — deliberately narrower than accord). */
const PARAM_KIND_TABLE: Record<string, "u64" | "u16"> = {
  MinStake: "u64",
  FeePerJuror: "u64",
  ReviewWindow: "u64",
  CommitWindow: "u64",
  RevealWindow: "u64",
  AppealWindow: "u64",
  AlphaBps: "u16",
};

/**
 * Parse `--payload Kind:value` into a `SubaccordParamArgs`. Only the seven
 * v1 levers; MaxAppeals/RevealThresholdBps/MaxDrawAttempts/Authority/
 * EvidenceOperator are deliberately not exposed (set_subaccord_param.rs).
 */
export function parseSubaccordParam(raw: string): SubaccordParamArgs {
  const idx = raw.indexOf(":");
  if (idx < 0) {
    throw new Error(`Invalid payload "${raw}" — expected Kind:value (e.g. MinStake:2000).`);
  }
  const kind = raw.slice(0, idx);
  const value = raw.slice(idx + 1);
  const width = PARAM_KIND_TABLE[kind];
  if (width === "u64") {
    return { __kind: kind, fields: [toBigInt(kind, value, 64)] } as SubaccordParamArgs;
  }
  if (width === "u16") {
    return { __kind: kind, fields: [Number(toBigInt(kind, value, 16))] } as SubaccordParamArgs;
  }
  throw new Error(
    `Unknown payload kind "${kind}". Expected one of ${Object.keys(PARAM_KIND_TABLE).join(", ")}.`,
  );
}
