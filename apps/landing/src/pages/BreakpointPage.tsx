// /2026-breakpoint-blade-pool — the pool page: offer hero + the full policy fineprint.
// Slim nav (back to the platform page) and the standard footer for wayfinding.
import { LogoLockup, TopNav } from "@riprap/ui";
import { RouteHead } from "../components/RouteHead";
import { Footer } from "../sections/Footer";
import { PolicyFineprint } from "../sections/pool/PolicyFineprint";
import { PoolHero } from "../sections/pool/PoolHero";

// Instance-surface head (messaging guide: platform page carries no peril or
// tiers; this page is the instance surface, so both are allowed here).
// Numbers: entry fees / payout caps per policy §5; window and venue per §2.
const BREAKPOINT_HEAD = {
  title: "Riprap: Blade Pool @ Breakpoint 2026",
  description:
    "A one-shot pool for Breakpoint 2026, Olympia, London, 15-17 November. Entry $10/$20/$40; payouts capped at $1,000/$2,000/$4,000; unused funds return pro-rata.",
  path: "/2026-breakpoint-blade-pool",
  jsonLd: [
    {
      "@context": "https://schema.org",
      "@type": "WebPage",
      "@id": "https://riprap.xyz/2026-breakpoint-blade-pool#webpage",
      url: "https://riprap.xyz/2026-breakpoint-blade-pool",
      name: "Riprap: Blade Pool @ Breakpoint 2026",
      about: { "@id": "https://riprap.xyz/2026-breakpoint-blade-pool#event" },
    },
    {
      "@context": "https://schema.org",
      "@type": "Event",
      "@id": "https://riprap.xyz/2026-breakpoint-blade-pool#event",
      name: "Breakpoint 2026",
      startDate: "2026-11-15",
      endDate: "2026-11-17",
      eventStatus: "https://schema.org/EventScheduled",
      eventAttendanceMode: "https://schema.org/OfflineEventAttendanceMode",
      location: {
        "@type": "Place",
        name: "Olympia Convention Centre, London",
      },
      url: "https://solana.com/breakpoint",
    },
  ],
} as const;

export function BreakpointPage() {
  return (
    <>
      <RouteHead {...BREAKPOINT_HEAD} />
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
