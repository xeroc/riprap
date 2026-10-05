// The mutuals directory data (copy doc §1.2 MUTUALS + the /mutuals route).
// Two classes share the rails: risk-protection mutuals (Micro Mutual policy
// docs) and verified-act bounties (Micro Bounty terms docs) — bounties share
// no risk, they pay for confirmed acts. Tier prices are the docs' §5 tables
// verbatim. CAVEAT: every pool except Blade Pool carries "[TODO: confirm
// prices]" — draft values, not final.
//
// Demo stats (members / pot size) are deterministic placeholders — founder
// ask, experiment only, NOT FOR DEPLOY: replace with chain reads when pools
// deploy. The hash keeps the numbers stable per pool across renders.
// Badges ("Most popular", "Certified ridiculous") are founder-set
// merchandising on the experiment, not metrics.

import { SUPPORTERS, type Supporter } from "../sections/Supporters";
import type { MutualListing } from "./types";

export type { MutualListing, MutualTier, PoolKind } from "./types";

/** The shared event frame — every pool in the first batch runs at Breakpoint. */
export const MUTUAL_EVENT = {
  event: "Breakpoint 2026",
  venue: "Olympia Convention Centre, London",
  window: "15–17 November 2026",
} as const;

/** Display order (founder call, 2026-10-05): Chairmageddon leads with the
 * most-popular badge, mutuals then bounties, Blade Pool second. */
export const MUTUALS: MutualListing[] = [
  {
    name: "Chairmageddon",
    kind: "mutual",
    // policy: Micro Mutual — Chairmageddon - Policy.md §3/§5 (prices TODO-confirm)
    tagline: "Every seat taken at the opening ceremony — and you stood the whole thing.",
    tiers: [{ name: "Flat", fee: 10, cap: 40 }],
    status: "Policy draft",
    badge: "Most popular",
  },
  {
    name: "Blade Pool",
    kind: "mutual",
    // policy: Micro Mutual — Knife Assault - Policy.md §1/§3/§5
    tagline: "Bodily injury caused by another person with a knife or blade, during the conference.",
    tiers: [
      { name: "Basic", fee: 10, cap: 1000 },
      { name: "Standard", fee: 20, cap: 2000 },
      { name: "Premium", fee: 40, cap: 4000 },
    ],
    status: "First pool",
    href: "#/2026-breakpoint-blade-pool",
  },
  {
    name: "NGMI Hairline",
    kind: "mutual",
    // policy: Micro Mutual — NGMI Hairline - Policy.md §3/§5 (prices TODO-confirm)
    tagline:
      "New gray hair first visible during the conference — graded from a countable few to basically Gandalf.",
    tiers: [
      { name: "Basic", fee: 5, cap: 50 },
      { name: "Standard", fee: 10, cap: 100 },
      { name: "Premium", fee: 20, cap: 200 },
    ],
    status: "Policy draft",
    badge: "Certified ridiculous",
  },
  {
    name: "Coffee Apocalypse",
    kind: "mutual",
    // policy: Micro Mutual — Coffee Apocalypse - Policy.md §3/§5 (prices TODO-confirm)
    tagline:
      "The coffee point runs out while you're standing in the queue. You leave with nothing.",
    tiers: [{ name: "Flat", fee: 10, cap: 25 }],
    status: "Policy draft",
  },
  {
    name: "OnlyFriends",
    kind: "bounty",
    // terms: Micro Bounty — OnlyFriends - Terms.md §3/§5 (prices TODO-confirm)
    tagline:
      "Confirmed introductions of a member to a listed VIP — paid per introduction, capped at ten.",
    tiers: [{ name: "Flat", fee: 25, cap: 150 }],
    status: "Terms draft",
  },
  {
    name: "Operation Keep Raj Warm",
    kind: "bounty",
    // terms: Micro Bounty — Operation Keep Raj Warm - Terms.md §3/§5 (TODO-confirm)
    tagline:
      "Bring Raj a hot drink he asked for — hand to hand, still hot, confirmed by Raj himself.",
    tiers: [{ name: "Flat", fee: 5, cap: 50 }],
    status: "Terms draft",
  },
  {
    name: "Lily's Liquid Lifeline",
    kind: "bounty",
    // terms: Micro Bounty — Lily's Liquid Lifeline - Terms.md §3/§5 (TODO-confirm)
    tagline:
      "Bring Lily a hot drink she asked for — hand to hand, still hot, confirmed by Lily herself.",
    tiers: [{ name: "Flat", fee: 5, cap: 50 }],
    status: "Terms draft",
  },
  {
    name: "Toly Needs His Fuel",
    kind: "bounty",
    // terms: Micro Bounty — Toly Needs His Fuel - Terms.md §3/§5 (TODO-confirm)
    tagline:
      "Bring Toly a hot drink he asked for — hand to hand, still hot, confirmed by Toly himself.",
    tiers: [{ name: "Flat", fee: 5, cap: 50 }],
    status: "Terms draft",
  },
];

/** `$10` or `$10–$40` — the entry-fee span across tiers (docs §5). */
export function entryRange(m: MutualListing): string {
  const fees = m.tiers.map((t) => t.fee);
  const min = Math.min(...fees);
  const max = Math.max(...fees);
  return min === max ? `$${min}` : `$${min}–$${max}`;
}

/** `up to $4,000` — the highest tier cap (docs §5): cover for mutuals, the earned bounty for bounties. */
export function capRange(m: MutualListing): string {
  return `up to $${Math.max(...m.tiers.map((t) => t.cap)).toLocaleString("en-US")}`;
}

/** The payout stat's label — bounties earn, mutuals are covered. */
export function payoutWord(m: MutualListing): string {
  return m.kind === "bounty" ? "earns" : "cover";
}

/** Deterministic string hash (djb2) — keeps demo stats stable per pool. */
function hash(input: string): number {
  let h = 5381;
  for (let i = 0; i < input.length; i++) {
    h = ((h << 5) + h + input.charCodeAt(i)) | 0;
  }
  return Math.abs(h);
}

/**
 * DEMO STATS — placeholder numbers (experiment, NOT FOR DEPLOY): members is
 * derived from the pool name, the pot from members × the middle tier fee.
 * Replace with chain reads (pool total, member count) when live.
 */
export function demoStats(m: MutualListing): { members: number; pool: number } {
  const members = 120 + (hash(m.name) % 820);
  const fees = m.tiers.map((t) => t.fee).sort((a, b) => a - b);
  const mid = fees[Math.floor(fees.length / 2)];
  return { members, pool: members * mid };
}

/** The card's supporter discs — a deterministic rotation of the mention list. */
export function supportersFor(m: MutualListing, count = 5): Supporter[] {
  if (SUPPORTERS.length === 0) return [];
  const offset = hash(m.name) % SUPPORTERS.length;
  return Array.from({ length: Math.min(count, SUPPORTERS.length) }, (_, i) => {
    const s = SUPPORTERS[(offset + i) % SUPPORTERS.length];
    return s as Supporter;
  });
}
