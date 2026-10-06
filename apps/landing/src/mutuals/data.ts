// The mutuals directory data (copy doc §1.2 MUTUALS + the /mutuals route).
// Two classes share the rails: risk-protection mutuals (Micro Mutual policy
// docs) and verified-act bounties (Micro Bounty terms docs) — bounties share
// no risk, they pay for confirmed acts. Tier prices are the docs' §5 tables
// verbatim. CAVEAT: every pool except Blade Pool and NGMI Hairline carries
// "[TODO: confirm prices]" — draft values, not final.
//
// Each pool pins the on-chain MUTUAL pubkey (route `#/m/<pubkey>`); until a
// pool deploys, its slug routes and `pubkey` stays unset. All pools go live
// together when they go on-chain, so no status field exists.
//
// Demo stats (members / pot size) are deterministic placeholders — founder
// ask, experiment only, NOT FOR DEPLOY: replace with chain reads when pools
// deploy. Badges ("Most popular", "Certified ridiculous") are founder-set
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
    slug: "chairmageddon",
    // policy: Micro Mutual — Chairmageddon - Policy.md §3/§5 (prices TODO-confirm)
    tagline: "Every seat taken at the opening ceremony — and you stood the whole thing.",
    tiers: [{ name: "Flat", fee: 10, cap: 40 }],
    badge: "Most popular",
  },
  {
    name: "Blade Pool",
    kind: "mutual",
    slug: "blade-pool",
    // policy: Micro Mutual — Knife Assault - Policy.md §1/§3/§5. The live
    // mutual address is env-driven (pool/mutual.ts) — pin pubkey at deploy.
    tagline: "Bodily injury caused by another person with a knife or blade, during the conference.",
    tiers: [
      { name: "Basic", fee: 10, cap: 1000 },
      { name: "Standard", fee: 20, cap: 2000 },
      { name: "Premium", fee: 40, cap: 4000 },
    ],
    badge: "Certified paranoid", // founder call 2026-10-06: the one severe pool gets the self-aware label
    href: "#/2026-breakpoint-blade-pool",
  },
  {
    name: "NGMI Hairline",
    kind: "mutual",
    slug: "ngmi-hairline",
    // policy: Micro Mutual — NGMI Hairline - Policy.md §3/§5 (flat $25 →
    // $200 set 2026-10-06; grades pay $20/$60/$100/$200)
    tagline:
      "New gray hair first visible during the conference — graded from a countable few to basically Gandalf.",
    tiers: [{ name: "Flat", fee: 25, cap: 200 }],
    badge: "Certified ridiculous",
  },
  {
    name: "Coffee Apocalypse",
    kind: "mutual",
    slug: "coffee-apocalypse",
    // policy: Micro Mutual — Coffee Apocalypse - Policy.md §3/§5 (prices TODO-confirm)
    tagline:
      "The coffee point runs out while you're standing in the queue. You leave with nothing.",
    tiers: [{ name: "Flat", fee: 10, cap: 25 }],
  },
  {
    name: "OnlyFriends",
    kind: "bounty",
    slug: "onlyfriends",
    // terms: Micro Bounty — OnlyFriends - Terms.md §3/§5 (prices TODO-confirm)
    tagline:
      "Confirmed introductions of a member to a listed VIP — paid per introduction, capped at ten.",
    tiers: [{ name: "Flat", fee: 25, cap: 150 }],
  },
  {
    name: "Operation Keep Raj Warm",
    kind: "bounty",
    slug: "keep-raj-warm",
    // terms: Micro Bounty — Operation Keep Raj Warm - Terms.md §3/§5 (TODO-confirm)
    tagline:
      "Bring Raj a hot drink he asked for — hand to hand, still hot, confirmed by Raj himself.",
    tiers: [{ name: "Flat", fee: 5, cap: 50 }],
  },
  {
    name: "Lily's Liquid Lifeline",
    kind: "bounty",
    slug: "lilys-liquid-lifeline",
    // terms: Micro Bounty — Lily's Liquid Lifeline - Terms.md §3/§5 (TODO-confirm)
    tagline:
      "Bring Lily a hot drink she asked for — hand to hand, still hot, confirmed by Lily herself.",
    tiers: [{ name: "Flat", fee: 5, cap: 50 }],
  },
  {
    name: "Toly Needs His Fuel",
    kind: "bounty",
    slug: "toly-needs-his-fuel",
    // terms: Micro Bounty — Toly Needs His Fuel - Terms.md §3/§5 (TODO-confirm)
    tagline:
      "Bring Toly a hot drink he asked for — hand to hand, still hot, confirmed by Toly himself.",
    tiers: [{ name: "Flat", fee: 5, cap: 50 }],
  },
];

/** The pool's detail-route id — the pinned pubkey, else the slug. */
export function poolRouteId(m: MutualListing): string {
  return m.pubkey ?? m.slug;
}

/** The pool's detail route, `#/m/<pubkey-or-slug>`. */
export function poolRoute(m: MutualListing): string {
  return `#/m/${poolRouteId(m)}`;
}

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
