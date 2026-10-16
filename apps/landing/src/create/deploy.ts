// deploy.ts — the #/create wizard's deploy-half helpers (copy doc § /create
// steps DEPLOY/PUBLISH/VERIFY): the daemon PUT/GET for the terms document
// (the RawPolicyTerms proof-mode path, creator-side — HANSE_DOMAIN_SPEC
// _UPLOAD §2) and the arg mappings for initialize_mutual. Pure module —
// fetch is the only effect, passed in as a seam for tests.

import type { Address } from "@solana/kit";
import { hansePreimage, toHex } from "../pool/domainRef";
import type { AdvancedConfig, DefDoc } from "./doc";
import { dateToUnix, defToOnChainTiers, hoursToSecs, usdcToMicro } from "./doc";

/** The daemon's per-cluster base — the same resolver every evidence surface
 * uses (pool/evidenceServer.ts). */
export type DaemonBase = string;

/** One deadpan line per non-2xx PUT (copy doc § /create PUBLISH states). */
export function publishFailureLine(status: number): string {
  if (status === 400) return "The daemon rejected the document.";
  if (status === 404) return "The daemon can't see the mutual yet. Try again in a moment.";
  if (status === 409) {
    return "Different bytes are already stored at this address — nothing was overwritten.";
  }
  return "The daemon is unreachable.";
}

export type PublishResult = { ok: true } | { ok: false; line: string };

/**
 * PUT the exact previewed bytes at the derived domain ref — hash-gated
 * proof mode (the daemon derives the subaccord PDA from the `subaccord +
 * preimage` query params and checks the ref before storing;
 * RawPolicyTerms' operator-side path, same wire format, creator-side).
 */
export async function putDocument(
  fetchImpl: typeof fetch,
  base: DaemonBase,
  ref: string,
  subaccord: string,
  preimage: string,
  bytes: Uint8Array<ArrayBuffer>,
): Promise<PublishResult> {
  const query = `?subaccord=${encodeURIComponent(subaccord)}&preimage=${preimage}&offset=23`;
  try {
    const response = await fetchImpl(`${base}/domains/${ref}${query}`, {
      method: "PUT",
      headers: { "Content-Type": "text/markdown" },
      body: new Blob([bytes], { type: "text/markdown" }),
    });
    if (response.status === 200 || response.status === 201) return { ok: true };
    return { ok: false, line: publishFailureLine(response.status) };
  } catch {
    return { ok: false, line: publishFailureLine(0) };
  }
}

export type VerifyResult = { state: "match" } | { state: "mismatch" } | { state: "unreachable" };

/** GET the ref back and compare by sha256 — a read-back whose hash equals
 * the previewed hash is the exact bytes. */
export async function verifyDocument(
  fetchImpl: typeof fetch,
  base: DaemonBase,
  ref: string,
  expectedSha256: string,
  sha256Hex: (bytes: Uint8Array) => Promise<string>,
): Promise<VerifyResult> {
  try {
    const response = await fetchImpl(`${base}/domains/${ref}`);
    if (!response.ok) {
      return response.status === 404 ? { state: "mismatch" } : { state: "unreachable" };
    }
    const bytes = new Uint8Array(await response.arrayBuffer());
    return (await sha256Hex(bytes)) === expectedSha256 ? { state: "match" } : { state: "mismatch" };
  } catch {
    return { state: "unreachable" };
  }
}

/** What the wizard freezes at deploy success — the exact deployed
 * artifacts every later step renders (the live draft is cleared). */
export interface Deployed {
  signature: string;
  /** The mutual PDA — the pool page's route id. */
  mutual: string;
  subaccord: string;
  seed: bigint;
  /** domain ref hex — the document's content address. */
  ref: string;
  /** sha256 hex of the doc bytes == the on-chain policy hash. */
  hash: string;
  /** The exact previewed-and-deployed document. */
  doc: string;
}

/** The preimage hex the daemon's proof mode wants (hansePreimage —
 * pool/domainRef.ts, the single source). */
export function preimageHex(seed: bigint, hashBytes: Uint8Array): string {
  return toHex(hansePreimage(seed, hashBytes));
}

/** The subaccord economics the drawer carries → the on-chain arg shape
 * (hours → seconds, USDC → raw). The evidence operator is the caller's
 * resolved value: the cluster's configured operator, else the creator's
 * wallet (v1: the initializer's key, EVENT-MUTUAL §7) — the wizard never
 * customizes it (founder call 2026-10-16). */
export function subaccordArgs(
  advanced: AdvancedConfig,
  evidenceOperator: Address,
): {
  feePerJuror: bigint;
  minStake: bigint;
  alphaBps: number;
  reviewWindow: bigint;
  commitWindow: bigint;
  revealWindow: bigint;
  appealWindow: bigint;
  maxAppeals: number;
  minJurySize: number;
  revealThresholdBps: number;
  maxDrawAttempts: number;
  evidenceOperator: Address;
} {
  return {
    feePerJuror: usdcToMicro(advanced.feePerJurorUsdc),
    minStake: usdcToMicro(advanced.minStakeUsdc),
    alphaBps: advanced.alphaBps,
    reviewWindow: BigInt(hoursToSecs(advanced.reviewHours)),
    commitWindow: BigInt(hoursToSecs(advanced.commitHours)),
    revealWindow: BigInt(hoursToSecs(advanced.revealHours)),
    appealWindow: BigInt(hoursToSecs(advanced.appealHours)),
    maxAppeals: advanced.maxAppeals,
    minJurySize: advanced.minJurySize,
    revealThresholdBps: advanced.revealThresholdBps,
    maxDrawAttempts: advanced.maxDrawAttempts,
    evidenceOperator,
  };
}

/** The def's window → the two on-chain timestamps (unix seconds, u64). */
export function windowArgs(def: DefDoc): { depositsCloseAt: bigint; claimsCloseAt: bigint } {
  return {
    depositsCloseAt: BigInt(dateToUnix(def.period.start)),
    claimsCloseAt: BigInt(dateToUnix(def.period.claimsClose)),
  };
}

/** Def tiers → the on-chain `[Tier; 3]` args (pads by repeating the last). */
export function tierArgs(def: DefDoc): { contribution: bigint; maxPayout: bigint }[] {
  return defToOnChainTiers(def);
}
