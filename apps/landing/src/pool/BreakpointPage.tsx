// #/2026-breakpoint-blade-pool — the Blade Pool's page: offer hero, concrete
// bands (how this pool runs · the math · the Breakpoint FAQ), then the policy
// in full — collapsed by default, explained or raw (landing-page.md §
// /2026-breakpoint-blade-pool page order, 2026-09-27). The hero is this
// pool's own component (pool/sections/PoolHero.tsx → BladeHero); the draft
// pools carry theirs under mutuals/pages/*Hero.tsx. The shared navbar
// (SiteNav — brand, How it works, X, Open App) and the standard footer for
// wayfinding. <title> swaps in the router (src/main.tsx).

import { SiteNav } from "../components/SiteNav";
import { poolByRouteId, poolBySlug } from "../mutuals/data";
import type { MutualListing } from "../mutuals/types";
import { Footer } from "../sections/Footer";
import { PolicyDetails } from "./sections/PolicyDetails";
import { PoolFaq } from "./sections/PoolFaq";
import { BladeHero } from "./sections/PoolHero";
import { PoolMath } from "./sections/PoolMath";
import { PoolMechanism } from "./sections/PoolMechanism";

export function BreakpointPage({ id }: { id?: string }) {
  // the route id picks the listing: #/m/<devnet-pin> serves the devnet
  // blade, #/m/<mainnet-pin> the mainnet one (each pin exists only on its
  // own cluster — the honest not-live state answers anywhere else); the
  // legacy path (no id) serves the canonical mainnet listing
  const listing: MutualListing =
    (id !== undefined ? poolByRouteId(id) : undefined) ?? poolBySlug("blade-pool");
  return (
    <>
      <SiteNav />
      <main>
        <BladeHero listing={listing} />
        <PoolMechanism />
        <PoolMath />
        <PolicyDetails />
        <PoolFaq />
      </main>
      <Footer />
    </>
  );
}
