// #/2026-breakpoint-blade-pool — the pool page: offer hero, concrete bands
// (how this pool runs · the math · the Breakpoint FAQ), then the policy in
// full — collapsed by default, explained or raw (landing-page.md §
// /2026-breakpoint-blade-pool page order, 2026-09-27). The shared navbar
// (SiteNav — brand, How it works, X, Open App) and the standard footer for
// wayfinding. <title> swaps in the router (src/main.tsx); OG/canonical/JSON-LD
// are the platform head in index.html — instance-surface copy per the
// messaging guide (platform page carries no peril or tiers; this page is the
// instance surface, so both are allowed).

import { SiteNav } from "../components/SiteNav";
import { Footer } from "../sections/Footer";
import { PolicyDetails } from "./sections/PolicyDetails";
import { PoolFaq } from "./sections/PoolFaq";
import { PoolHero } from "./sections/PoolHero";
import { PoolMath } from "./sections/PoolMath";
import { PoolMechanism } from "./sections/PoolMechanism";

export function BreakpointPage() {
  return (
    <>
      <SiteNav />
      <main>
        <PoolHero />
        <PoolMechanism />
        <PoolMath />
        <PolicyDetails />
        <PoolFaq />
      </main>
      <Footer />
    </>
  );
}
