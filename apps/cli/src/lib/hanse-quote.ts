/**
 * Pure settlement/payout math — exact ports of the on-chain formulas in
 * wide integers (bigint; on-chain they run in u128 checked arithmetic):
 *
 *   ratio_1e9  = settle_pool.rs: denominator 0 ⇒ 1e9, else
 *                min(1e9, floor(treasury × 1e9 / (obligations + fee_refunds)))
 *   payout     = claim_payout.rs: floor(claim_amount × ratio / 1e9)
 *                + floor(fee_paid × ratio / 1e9)   — each term floored
 *   burn       = min(payout, contribution) — §2.4: a paid claimant exits the
 *                residual, never burns more than it put in
 */
export function settlementRatio(treasury: bigint, obligations: bigint, feeRefunds: bigint): bigint {
  const denominator = obligations + feeRefunds;
  if (denominator === 0n) return 1_000_000_000n; // nothing owed: all residual
  const ratio = (treasury * 1_000_000_000n) / denominator;
  return ratio > 1_000_000_000n ? 1_000_000_000n : ratio;
}

export interface QuoteResult {
  ratio1e9: bigint;
  claimPart: bigint;
  feePart: bigint;
  payout: bigint;
  /** Saturating rights-stake burn; undefined when no contribution given. */
  burn: bigint | undefined;
}

export function quotePayout(input: {
  claimAmount: bigint;
  feePaid: bigint;
  ratio1e9: bigint;
  contribution?: bigint;
}): QuoteResult {
  const claimPart = (input.claimAmount * input.ratio1e9) / 1_000_000_000n;
  const feePart = (input.feePaid * input.ratio1e9) / 1_000_000_000n;
  const payout = claimPart + feePart;
  return {
    ratio1e9: input.ratio1e9,
    claimPart,
    feePart,
    payout,
    burn:
      input.contribution === undefined
        ? undefined
        : payout < input.contribution
          ? payout
          : input.contribution,
  };
}
