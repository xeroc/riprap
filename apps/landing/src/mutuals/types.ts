/** One pool in the mutuals directory — card (§1.2 band) and table (/mutuals). */
export interface MutualTier {
  name: string;
  /** entry fee in USD (policy §5 / terms §5) */
  fee: number;
  /** maximum payout in USD (policy §5 / terms §5) */
  cap: number;
}

export type PoolKind = "mutual" | "bounty";

export interface MutualListing {
  /** card + table name, e.g. "Blade Pool" */
  name: string;
  /** the pool class — risk-protection mutual or verified-act bounty */
  kind: PoolKind;
  /** one-liner, deadpan — the peril (or the paid act) named plainly */
  tagline: string;
  tiers: MutualTier[];
  status: "First pool" | "Policy draft" | "Terms draft";
  /** merchandising badge (founder-set, experiment only) — e.g. "Most popular" */
  badge?: string;
  /** instance surface when one exists */
  href?: string;
}
