/**
 * Crank contract — the single canonical seam between the reconciler's state
 * scan and the per-crank implementations (ported from @useaccord/cranker
 * src/types.ts, scaled to riprap's five cranks).
 *
 * Every riprap crank is permissionless by design; the pilot pass gate pins
 * claim_payout's cranker to the mutual's authority (ADR-0005) — the
 * reconciler checks that before emitting the action, so an unauthorized
 * cranker simply skips payouts rather than burning simulation fees.
 */

import type { Mutual } from "@riprap/hanse";
import type { Address, Instruction, Rpc, SolanaRpcApi, TransactionSigner } from "@solana/kit";

/** Every crank kind: the four hanse lifecycle cranks + the pool residual exit. */
export type CrankKind = "settle_claim" | "settle_pool" | "claim_payout" | "dissolve" | "pool_crank";

/** Discriminated action payload. `mutual`/`claim`/`pool`/`owner` are the accounts the crank acts on. */
export type CrankAction =
  | { kind: "settle_claim"; mutual: Address; claim: Address }
  | { kind: "settle_pool"; mutual: Address }
  | { kind: "claim_payout"; mutual: Address; claim: Address }
  | { kind: "dissolve"; mutual: Address }
  | { kind: "pool_crank"; pool: Address; owner: Address };

/** Extract a single crank action variant by kind (for executor signatures). */
export type ActionOf<K extends CrankKind> = Extract<CrankAction, { kind: K }>;

/**
 * Cranker environment — the unified context every crank handler receives:
 * RPC + the fee-payer signer + the send path. Built once per cycle by the
 * reconciler.
 */
export interface CrankContext {
  /** Live RPC (account fetches for instruction assembly). */
  readonly rpc: Rpc<SolanaRpcApi>;
  /** The cranker's transaction signer (fee payer on every crank tx). */
  readonly signer: TransactionSigner;
  /** Cranker fee-payer address (convenience = signer.address). */
  readonly cranker: Address;
  /**
   * Send one instruction as one tx, with retry + priority-fee escalation on
   * send failure. Returns the signature. Simulation failures throw and are
   * NOT retried (another cranker may have advanced the state).
   */
  readonly sendIx: (ix: Instruction) => Promise<string>;
  /** Structured per-crank log sink — `{kind} {subject} {msg}`. */
  readonly log: (kind: CrankKind, subject: Address | null, msg: string) => void;
}

/** Outcome of one crank attempt. */
export interface CrankResult {
  /** Tx signature on success. */
  signature?: string;
  /** Reason the crank was a deliberate no-op (e.g. wrong state, nothing to do). */
  skipped?: string;
}

/** The mutual a cycle resolved against — passed to per-mutual helpers. */
/** The mutual a cycle resolved against — scan-shaped (address + decoded data);
 * kit's full Account is assignable, the scans' lean hits are the floor. */
export type MutualAccount = { readonly address: Address; readonly data: Mutual };
