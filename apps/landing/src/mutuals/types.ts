/** One pool in the mutuals directory — card (§1.2 band) and table (/mutuals). */
export interface MutualTier {
  name: string;
  /** entry fee in USD (policy §5) */
  fee: number;
  /** maximum payout in USD (policy §5) */
  cap: number;
}

export interface MutualListing {
  /** card + table name, e.g. "Blade Pool" */
  name: string;
  /** one-liner, deadpan — the peril named plainly per the policy docs */
  tagline: string;
  tiers: MutualTier[];
  status: "First pool" | "Policy draft";
  /** instance surface when one exists */
  href?: string;
}
