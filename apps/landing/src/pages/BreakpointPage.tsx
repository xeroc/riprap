// /breakpoint-2026 — the pool page: offer hero + the full policy fineprint.
// Slim nav (back to the platform page) and the standard footer for wayfinding.
import { LogoLockup, TopNav } from "@riprap/ui";

import { Footer } from "../sections/Footer";
import { PolicyFineprint } from "../sections/pool/PolicyFineprint";
import { PoolHero } from "../sections/pool/PoolHero";

export function BreakpointPage() {
  return (
    <>
      <TopNav
        className="sticky top-0 z-40"
        links={[{ href: "/", label: "riprap.xyz" }]}
        brand={
          <a href="/" className="flex items-center gap-2.5" aria-label="Riprap home">
            <LogoLockup size={22} />
            <span className="ml-1 hidden items-center gap-1.5 font-mono text-xs text-muted-foreground sm:inline-flex">
              <span className="inline-block size-1.5 bg-accent" aria-hidden="true" />
              Blade Pool · Breakpoint 2026
            </span>
          </a>
        }
      />
      <main>
        <PoolHero />
        <PolicyFineprint />
      </main>
      <Footer />
    </>
  );
}
