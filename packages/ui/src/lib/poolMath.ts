/**
 * Riprap pool math — the money rules behind every visual channel.
 *
 * Sources (every number traceable — meta/primitives ground rule):
 * - tier table: policy doc §5 (the only allowed prices)
 * - pro-rata refund: policy §7 / §8, Pool Program liquidation crank
 * - fail-closed payouts: policy §7, meta/PROJECT.md "fail-closed economics"
 * - area = money scale: meta/primitives/composition.md § scale discipline
 */

export type TierName = "Basic" | "Standard" | "Premium";

export interface Tier {
  name: TierName;
  /** entry fee in USDC — the member's maximum contribution */
  fee: number;
  /** maximum payout in USDC */
  cap: number;
}

/** Policy doc §5. Exactly three tiers, every one 1:100 fee-to-cap. */
export const TIERS: readonly Tier[] = [
  { name: "Basic", fee: 10, cap: 1000 },
  { name: "Standard", fee: 20, cap: 2000 },
  { name: "Premium", fee: 40, cap: 4000 },
] as const;

export function tierFor(name: TierName): Tier {
  const t = TIERS.find((t) => t.name === name);
  if (!t) throw new Error(`unknown tier: ${name}`);
  return t;
}

/**
 * A member's pro-rata share of the remaining treasury at dissolution:
 * user_stake / total_stake × treasury (Pool Program § Liquidation).
 */
export function proRataShare(treasury: number, userStake: number, totalStake: number): number {
  if (totalStake <= 0) return 0;
  return (userStake / totalStake) * treasury;
}

/**
 * payout = min(tier cap, claimed amount) × P/A where P = pool balance and
 * A = total approved claims. Claims inside the pool pay in full; overdraw
 * scales every payout down by the same ratio so Σ payouts = P exactly.
 */
export function scaledPayout(
  claimedAmount: number,
  approvedTotal: number,
  poolBalance: number,
  tierCap = Number.POSITIVE_INFINITY,
): number {
  const capped = Math.min(tierCap, claimedAmount);
  if (approvedTotal <= poolBalance) return Math.min(capped, poolBalance);
  return (capped * poolBalance) / approvedTotal;
}

/**
 * Fill height for a vessel interior of constant width: linear map from
 * balance to pixels, clamped at the rim. Same mapping across compared
 * frames is what makes area = money true (composition.md).
 */
export function fillHeight(balance: number, maxBalance: number, maxHeight: number): number {
  if (maxBalance <= 0) return 0;
  return Math.max(0, Math.min(1, balance / maxBalance)) * maxHeight;
}

/** Deadpan money printer: cents only when they matter. */
export function usd(n: number): string {
  const whole = Number.isInteger(n);
  return `$${n.toLocaleString("en-US", {
    minimumFractionDigits: whole ? 0 : 2,
    maximumFractionDigits: whole ? 0 : 2,
  })}`;
}
