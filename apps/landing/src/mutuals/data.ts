// The mutuals directory data (copy doc §1.2 MUTUALS + the /mutuals route).
// Sources: the Micro Mutual policy docs in meta/Breakpoint/ — tier prices are
// policy §5 verbatim. CAVEAT: NGMI Hairline, Chairmageddon, and Coffee
// Apocalypse carry "[TODO: confirm prices]" in their policies — the numbers
// here are the draft values, not final. Blade Pool prices are final (§5).
//
// Demo stats (members / pool size) are deterministic placeholders — founder
// ask, experiment only, NOT FOR DEPLOY: replace with chain reads when pools
// deploy. The hash keeps the numbers stable per pool across renders.

import { SUPPORTERS, type Supporter } from "../sections/Supporters";
import type { MutualListing } from "./types";

export type { MutualListing, MutualTier } from "./types";

/** The shared event frame — every pool in the first batch runs at Breakpoint. */
export const MUTUAL_EVENT = {
  event: "Breakpoint 2026",
  venue: "Olympia Convention Centre, London",
  window: "15–17 November 2026",
} as const;

export const MUTUALS: MutualListing[] = [
  {
    name: "Blade Pool",
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
    // policy: Micro Mutual — NGMI Hairline - Policy.md §3/§5 (prices TODO-confirm)
    tagline:
      "New gray hair first visible during the conference — graded from a countable few to basically Gandalf.",
    tiers: [
      { name: "Basic", fee: 5, cap: 50 },
      { name: "Standard", fee: 10, cap: 100 },
      { name: "Premium", fee: 20, cap: 200 },
    ],
    status: "Policy draft",
  },
  {
    name: "Chairmageddon",
    // policy: Micro Mutual — Chairmageddon - Policy.md §3/§5 (prices TODO-confirm)
    tagline: "Every seat taken at the opening ceremony — and you stood the whole thing.",
    tiers: [{ name: "Flat", fee: 10, cap: 40 }],
    status: "Policy draft",
  },
  {
    name: "Coffee Apocalypse",
    // policy: Micro Mutual — Coffee Apocalypse - Policy.md §3/§5 (prices TODO-confirm)
    tagline:
      "The coffee point runs out while you're standing in the queue. You leave with nothing.",
    tiers: [{ name: "Flat", fee: 10, cap: 25 }],
    status: "Policy draft",
  },
];

/** `$10` or `$10–$40` — the entry-fee span across tiers (policy §5). */
export function entryRange(m: MutualListing): string {
  const fees = m.tiers.map((t) => t.fee);
  const min = Math.min(...fees);
  const max = Math.max(...fees);
  return min === max ? `$${min}` : `$${min}–$${max}`;
}

/** `up to $4,000` — the highest tier cap (policy §5). */
export function capRange(m: MutualListing): string {
  return `up to $${Math.max(...m.tiers.map((t) => t.cap)).toLocaleString("en-US")}`;
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
 * derived from the pool name, the pool total from members × the middle tier
 * fee. Replace with chain reads (pool total, member count) when live.
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
