// §1 — hero: platform one-liner, waitlist. First-pool stamp: retired
// 2026-09-15, returned 2026-09-21 (links the pool page).
import { HexBackdrop, Logomark, SectionBand, StampBadge } from "@riprap/ui";
import { Settle } from "../components/Settle";
import { Waitlist } from "../components/Waitlist";

// §1 — Settled hero (2026-09-15 line set, messaging guide): the thesis names
// the category shift, the subhead opens with the member one-liner, then the
// mechanism sentence. Plain-words law: no "mutual" in the hero or taglines;
// the lineage section keeps the historical word. Left-biased editorial:
// copy column + the mark assembling beside it, centered.
export function Hero() {
  return (
    <div className="relative">
      {/* engineering paper: hex lattice present from first paint; filled
          cells settle in on a radial wave from where the ring lands */}
      <HexBackdrop className="pointer-events-none absolute inset-0 z-0 size-full" />
      <SectionBand
        id="top"
        tone="ground"
        className="relative z-10 bg-transparent pt-(--riprap-space-section)"
      >
        <div className="grid items-center gap-(--riprap-space-xl) lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex flex-col gap-(--riprap-space-lg)">
            <Settle>
              <p className="uppercase tracking-(--riprap-tracking-stamp) text-accent [font:var(--riprap-mono-label)]">
                Real World Risk Pools on Solana
              </p>
            </Settle>
            <Settle delay={60}>
              <h1 className="max-w-3xl tracking-(--riprap-tracking-mega) text-ink [font:var(--riprap-display-md)] sm:[font:var(--riprap-display-xl)] lg:[font:var(--riprap-display-mega)]">
                Finance went P2P. <br />
                Risk Cover can too.
              </h1>
            </Settle>
            <Settle delay={120}>
              <p className="max-w-[36rem] leading-relaxed text-body [font:var(--riprap-body-md)]">
                Your group's got you covered. Riprap is peer-to-peer cover on Solana: any group can
                start a pool — chip in, define what's covered, drawn peers settle claims, the money
                stays the group's.
              </p>
            </Settle>
            <Settle delay={180} className="pt-(--riprap-space-sm)">
              <Waitlist />
            </Settle>
            <Settle delay={240}>
              <div className="flex flex-wrap items-center gap-3">
                <span className="relative inline-flex">
                  <span
                    aria-hidden="true"
                    className=" pointer-events-none absolute inset-0 rounded-[inherit] bg-(--riprap-accent)/15 blur-md motion-safe:animate-ping motion-reduce:hidden "
                  />
                  <a
                    href="#/2026-breakpoint-blade-pool"
                    aria-label="Blade Pool at Breakpoint 2026 — policy and participation"
                    className=" relative z-10 inline-flex transition-transform duration-200 ease-out hover:-translate-y-0.5 hover:scale-[1.02] focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring "
                  >
                    <StampBadge pool="Blade Pool" event="Breakpoint" />
                  </a>
                </span>

                <p className="text-muted-foreground [font:var(--riprap-mono-label)]">
                  First pool · Olympia Convention Centre, London · 15-17 November 2026
                </p>
              </div>
            </Settle>
          </div>
          <div className="hidden lg:block">
            {/* the ring: 7 stones settle clockwise, the harbor-blue newest member last (DESIGN.md § Motion) */}
            <Logomark size={208} state="assemble" />
          </div>
        </div>
      </SectionBand>
    </div>
  );
}
