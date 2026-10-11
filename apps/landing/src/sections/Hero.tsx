// §1 — hero: platform one-liner, the browse CTA, waitlist demoted to
// secondary. Payout-pool pass (2026-10-06, copy doc §1, messaging-guide
// § Payout-Pool Pass): the campaign line as H1 — WHY-led, the one line
// true of every pool, cover or bounty; the formal descriptor as kicker;
// the member line opens the subhead; bounties ride as one clause.
// v4 rules keep: no pool named in the hero, no instance numbers; the
// primary CTA scrolls to the pools band (§1.2); the waitlist stays,
// low priority. "Insurer" is off the page.
// 2026-10-09 founder ask: the H1 rotates through what Riprap is — the
// locked campaign line leads (first paint, the no-JS and reduced-motion
// read), the rest settle in on a 2.5s cadence; every phrase is 2–3 words
// from the marketing material (provenance per line below).

import { Button, HexBackdrop, Logomark, SectionBand } from "@riprap/ui";
import { AnimatePresence, motion, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { Settle } from "../components/Settle";
import { Waitlist } from "../components/Waitlist";

/** The rotating one-liners — 2–3 words each, from the marketing material.
 * The first is the founder-locked campaign H1 (copy doc §1, 2026-10-06);
 * it stays alone under reduced motion and is what loads without JS. */
export const HEADLINES = [
  "Self-governing money",
  "Pooled cover",
  "Mutuals on Solana",
  "Payout pools",
  "On-chain insurance",
  "P2P purpose pools",
] as const;

/** The 2.5s flip (founder template 2026-10-09): the current phrase blurs
 * out upward, the next blurs in from below — a crossfade on the settle
 * quart, no bounce. The last two phrases carry the accent (the
 * register-risky words stand out on purpose). Reduced motion keeps the
 * first phrase static: the locked campaign line, which is also the no-JS
 * read. Silent to screen readers — no live region, so the H1 announces
 * as the line it loads with. The trailing period rides as the suffix so
 * it never animates. */
function HeadlineCycle({ words, suffix }: { words: readonly string[]; suffix?: string }) {
  const reduce = useReducedMotion();
  const [index, setIndex] = useState(0);

  useEffect(() => {
    if (reduce) return;
    const id = window.setInterval(() => setIndex((i) => (i + 1) % words.length), 2500);
    return () => window.clearInterval(id);
  }, [reduce, words.length]);

  if (reduce) {
    return (
      <>
        {words[index]}
        {suffix}
      </>
    );
  }

  return (
    <>
      <AnimatePresence mode="wait">
        <motion.span
          key={index}
          initial={{ opacity: 0, filter: "blur(8px)", y: 8 }}
          animate={{ opacity: 1, filter: "blur(0px)", y: 0 }}
          exit={{ opacity: 0, filter: "blur(8px)", y: -8 }}
          transition={{ duration: 0.32, ease: [0.215, 0.61, 0.355, 1] }}
          className={`relative inline-block`}
        >
          {words[index]}
        </motion.span>
      </AnimatePresence>
      {suffix}
    </>
  );
}

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
                Pooled cover on Solana
              </p>
            </Settle>
            <Settle delay={60}>
              <h1 className="max-w-3xl tracking-(--riprap-tracking-mega) text-ink [font:var(--riprap-display-md)] sm:[font:var(--riprap-display-xl)] lg:[font:var(--riprap-display-mega)]">
                <HeadlineCycle words={HEADLINES} suffix="." />
              </h1>
            </Settle>
            <Settle delay={120}>
              <p className="max-w-[36rem] leading-relaxed text-body [font:var(--riprap-body-md)]">
                Each pool runs on its own terms, written before anyone joins. Accept them when you
                join, and you can claim from the pool. Claims are reviewed and approved by other
                pool members — transparent and on-chain. Build bounties, mutuals or insurances.
              </p>
            </Settle>
            {/* primary: browse the pools — the waitlist rides below, secondary */}
            <Settle delay={180} className="flex flex-col gap-5 pt-(--riprap-space-sm)">
              <div className="flex flex-wrap items-center gap-4">
                <Button asChild>
                  <a href="#mutuals">Browse the pools</a>
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
