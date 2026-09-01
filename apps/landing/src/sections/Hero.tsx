import { Logomark, SectionBand, StampBadge } from "@riprap/ui";

import { Settle } from "../components/Settle";
import { Waitlist } from "../components/Waitlist";

// §1 — Settled hero. Platform one-liner + the waitlist; the first pool rides
// along as a stamp, not the headline (platform leads, instance second).
// Left-biased editorial: copy column + the mark assembling bottom-right.
export function Hero() {
  return (
    <SectionBand id="top" tone="ground" className="pt-(--riprap-space-section)">
      <div className="grid items-end gap-(--riprap-space-xl) lg:grid-cols-[minmax(0,1fr)_auto]">
        <div className="flex flex-col gap-(--riprap-space-lg)">
          <Settle>
            <p className="uppercase tracking-(--riprap-tracking-stamp) text-accent [font:var(--riprap-mono-label)]">
              Event mutuals on Solana
            </p>
          </Settle>
          <Settle delay={60}>
            <h1 className="max-w-3xl tracking-(--riprap-tracking-mega) text-ink [font:var(--riprap-display-md)] sm:[font:var(--riprap-display-xl)] lg:[font:var(--riprap-display-mega)]">
              Any event. Any narrow peril. One finite pool.
            </h1>
          </Settle>
          <Settle delay={120}>
            <p className="max-w-[36rem] leading-relaxed text-body [font:var(--riprap-body-md)]">
              Members pay a fixed entry fee into one pool against one peril, for one event. Peer
              jurors adjudicate claims, unused funds return pro-rata, the pool dissolves. Your worst
              case is the entry fee. The pool's worst case is empty.
            </p>
          </Settle>
          <Settle delay={180} className="pt-(--riprap-space-sm)">
            <Waitlist />
          </Settle>
          <Settle delay={240}>
            <div className="flex flex-wrap items-center gap-3 pt-(--riprap-space-sm)">
              <StampBadge pool="Blade Pool" event="Breakpoint" />
              <p className="text-muted-foreground [font:var(--riprap-mono-label)]">
                First pool · Olympia Convention Centre, London · 15–17 November 2026
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
  );
}
