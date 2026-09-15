// fixtures.ts — deterministic-ish builders shared across specs.
// Kept free of chain access so they're usable in any lane (incl. offline).
// Ported from the accord harness with the §12 pilot configuration
// (EVENT-MUTUAL §12: windows 48h/12h/12h, appeal 48h, max_appeals 2,
// fee_per_juror 5 USDC, min_stake 10 USDC — all 6-dp USDC units).

import type { Address } from "@solana/kit";
import { Aggregation, type CreateSubaccordArgs, ShortfallPolicy } from "@useaccord/sdk";

/** Solana `Pubkey::default()` (all-ones). Used as `authority` ⇒ immutable Subaccord. */
export const DEFAULT_PUBKEY: Address = "11111111111111111111111111111111" as Address;

/** Cryptographically random 32 bytes. Unique per call ⇒ unique domain_ref/PDA. */
export function randomBytes32(): Uint8Array {
  return crypto.getRandomValues(new Uint8Array(32));
}

/** §12 tier contributions (6-dp USDC): Basic $10 · Standard $20 · Premium $40. */
export const TIER_CONTRIBUTIONS = {
  basic: 10_000_000n,
  standard: 20_000_000n,
  premium: 40_000_000n,
} as const;

/** §12 fee_per_juror = 5 USDC; filing fee = 3 × this = 15 USDC. */
export const PILOT_FEE_PER_JUROR = 5_000_000n;

/** §12 min_stake floor = 10 USDC. */
export const PILOT_MIN_STAKE = 10_000_000n;

/**
 * `create_subaccord` args mirroring the pilot configuration the mutual's
 * `initialize_mutual` forwards (§7/§12): windows 48h/12h/12h, appeal 48h,
 * max_appeals 2, min_jury_size 3, fee_per_juror 5 USDC, min_stake 10 USDC,
 * alpha 10%. `domain_ref`/`evidence_spec` are freshly random so each run mints
 * a distinct Subaccord PDA (namespace-squat guard requires domain_ref ≠ 0).
 * Override any field via `overrides`.
 */
export function pilotSubaccordArgs(
  stakingToken: Address,
  feeToken: Address,
  evidenceOperator: Address,
  overrides: Partial<CreateSubaccordArgs> = {},
): CreateSubaccordArgs {
  return {
    domainRef: randomBytes32(),
    evidenceSpec: randomBytes32(),
    stakingToken,
    feeToken,
    minStake: PILOT_MIN_STAKE,
    alphaBps: 1_000, // §12: 10%
    reviewWindow: 172_800n, // §12: 48h
    commitWindow: 43_200n, // §12: 12h
    revealWindow: 43_200n, // §12: 12h
    appealWindow: 172_800n, // §12: 48h (crowdfund window)
    maxAppeals: 2, // §12: ladder 3 → 7 → 15
    minJurySize: 3, // §12: fixed
    aggregation: Aggregation.Plurality, // §7: binary Approve/Deny claims
    feePerJuror: PILOT_FEE_PER_JUROR,
    revealThresholdBps: 6_666, // 2/3 (ADR-0021; §12 leaves this at Accord default)
    shortfallPolicy: ShortfallPolicy.Redraw, // ADR-0021
    maxDrawAttempts: 3, // ADR-0021
    coherenceTolBps: 0, // Plurality default — exact-match coherence (ADR-0025)
    authority: DEFAULT_PUBKEY, // immutable (hand-made harness subaccords)
    evidenceOperator,
    depth: 4, // small for tests (2^4 = 16 seats max)
    ...overrides,
  };
}
