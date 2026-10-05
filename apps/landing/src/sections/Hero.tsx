// §1 — hero: platform one-liner, the browse CTA, waitlist demoted to
// secondary. OnRe experiment pass v2 (2026-10-05, copy doc §1, founder
// corrections): the canon destination line as H1, the canon Form line as
// kicker, member line opens the subhead. v4: featured pools no longer named
// in the hero — the primary CTA scrolls to the mutuals band (§1.2); the
// waitlist stays, low priority (copy doc § waitlist for the final-CTA
// capture point). "Insurer" is off the page. Provisional, NOT FOR DEPLOY.
import { HexBackdrop, Logomark, SectionBand, Button } from "@riprap/ui";
import { Settle } from "../components/Settle";
import { Waitlist } from "../components/Waitlist";

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
                Mutuals on Solana
              </p>
            </Settle>
            <Settle delay={60}>
              <h1 className="max-w-3xl tracking-(--riprap-tracking-mega) text-ink [font:var(--riprap-display-md)] sm:[font:var(--riprap-display-xl)] lg:[font:var(--riprap-display-mega)]">
                DeFi rebuilt finance. <br />
                Insurance is next.
              </h1>
            </Settle>
            <Settle delay={120}>
              <p className="max-w-[36rem] leading-relaxed text-body [font:var(--riprap-body-md)]">
                Your group's got you covered. The terms are written before anyone joins — chip in
                and you're covered up to the published cap. Claims are settled by drawn peers.
                Whatever the pool doesn't pay stays the group's.
              </p>
            </Settle>
            {/* primary: browse the pools — the waitlist rides below, secondary */}
            <Settle delay={180} className="flex flex-col gap-5 pt-(--riprap-space-sm)">
              <div className="flex flex-wrap items-center gap-4">
                <Button asChild>
                  <a href="#mutuals">Browse the mutuals</a>
                </Button>
                <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
                  First batch: Breakpoint 2026, London.
                </p>
              </div>
              <div className="flex max-w-md flex-col gap-1.5">
                <p className="text-muted-soft [font:var(--riprap-mono-label)]">
                  Or leave an email — one message when a pool opens.
                </p>
                <Waitlist />
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
