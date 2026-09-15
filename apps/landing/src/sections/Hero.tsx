// §1 — hero: platform one-liner, waitlist. The first-pool stamp is retired
// (2026-09-15); the pool page is reached by URL until an instances surface
// exists.
import { HexBackdrop, Logomark, SectionBand } from "@riprap/ui";
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
