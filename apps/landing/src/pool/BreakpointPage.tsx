// #/2026-breakpoint-blade-pool — the pool page: offer hero + the full policy
// fineprint. The shared navbar (SiteNav — brand, How it works, X, Open App)
// and the standard footer for wayfinding. <title> swaps in the router
// (src/main.tsx); OG/canonical/JSON-LD are the platform head in index.html —
// instance-surface copy per the messaging guide (platform page carries no
// peril or tiers; this page is the instance surface, so both are allowed).

import { SiteNav } from "../components/SiteNav";
import { Footer } from "../sections/Footer";
import { PolicyFineprint } from "./sections/PolicyFineprint";
import { PoolHero } from "./sections/PoolHero";

export function BreakpointPage() {
  return (
    <>
      <SiteNav />
      <main>
        <PoolHero />
        <PolicyFineprint />
      </main>
      <Footer />
    </>
  );
}
