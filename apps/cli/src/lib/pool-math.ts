/**
 * Money-weighted liquidation share — the exact on-chain crank formula:
 * `floor(treasury_balance × depositor_total / pool_total)`, computed in
 * wide integers (on-chain it is u128 checked intermediates).
 *
 * Provenance: programs/pool/src/instructions/crank.rs `payout()`
 * ("depositor total divided by all deposits, floored").
 */
export function moneyWeightedPayout(
  treasuryBalance: bigint,
  depositorTotal: bigint,
  poolTotal: bigint,
): bigint {
  // pool_total == 0 with an existing depositor is impossible on-chain.
  if (poolTotal === 0n) return 0n;
  return (treasuryBalance * depositorTotal) / poolTotal;
}
