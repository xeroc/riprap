// Test-only fixture: a decoded Mutual account with the pilot's policy §5
// numbers (fixtures scale: 6-dp USDC, $10 = 10_000_000n — same as the e2e
// TIER_CONTRIBUTIONS). Production code never imports this file.

import type { Mutual } from "@riprap/hanse";
import type { Address } from "@solana/kit";

const A = "1".repeat(32) as Address;
const USDC = 1_000_000n;

/** Policy §5 tiers: Basic $10/$1k · Standard $20/$2k · Premium $40/$4k. */
export const POLICY_TIERS = [
  { contribution: 10n * USDC, maxPayout: 1_000n * USDC },
  { contribution: 20n * USDC, maxPayout: 2_000n * USDC },
  { contribution: 40n * USDC, maxPayout: 4_000n * USDC },
];

export function fakeMutual(overrides: Partial<Mutual> = {}): Mutual {
  return {
    discriminator: new Uint8Array(8),
    authority: A,
    pool: A,
    subaccord: A,
    depositMint: A,
    feeMint: A,
    policyHash: new Uint8Array(32),
    tiers: POLICY_TIERS,
    // deposits open by default: closes 2026-11-15T00:00:00Z (event start)
    depositsCloseAt: 1_800_268_800n,
    claimsCloseAt: 1_811_808_000n,
    pullWindow: 86_400n,
    seed: 0n,
    phase: 0,
    pullCloseAt: 0n,
    ratio1e9: 0n,
    obligations: 0n,
    feeRefunds: 0n,
    claimsFiled: 0,
    claimsResolved: 0,
    claimNonce: 0n,
    bump: 255,
    ...overrides,
  } as Mutual;
}
