// /2026-breakpoint-blade-pool — the pool page hero, ludic-lite register (2026-09-05,
// landing-page.md §2026-breakpoint-blade-pool): one maximal headline, then a straight
// face. Numbers always real (policy §2/§5 via TIERS/usd, never hardcoded);
// the comedy lives in the odds table and the tier labels, never in the math.
// "Mutual" stays off the page per the messaging-guide demotion.
import {
  Button,
  Dialog,
  DialogContent,
  DialogDescription,
  DialogHeader,
  DialogTitle,
  DialogTrigger,
  HexBackdrop,
  SectionBand,
  Slider,
  StampBadge,
  TIERS,
  usd,
} from "@riprap/ui";
import { useState } from "react";

import { Settle } from "../../components/Settle";
import { Waitlist } from "../../components/Waitlist";

// Policy §5 default: Standard is the middle tier (index 1 of exactly three).
const DEFAULT_TIER = 1;

// One caption per tier, indexed like TIERS. Copy only — every number in this
// file renders through usd() from the kit's TIERS.
const TIER_NOTES = ["you're probably fine", "the group-chat special", "you've read the news"];

export function PoolHero() {
  const [tierIndex, setTierIndex] = useState(DEFAULT_TIER);
  const tier = TIERS[tierIndex];

  return (
    <div className="relative">
      {/* engineering paper: same lattice + breathing cells as the platform hero */}
      <HexBackdrop className="pointer-events-none absolute inset-0 z-0 size-full" />
      <SectionBand
        id="pool"
        tone="ground"
        className="relative z-10 bg-transparent pt-(--riprap-space-section)"
      >
        <div className="flex max-w-3xl flex-col gap-(--riprap-space-lg)">
          <Settle>
            <div className="flex flex-wrap items-center gap-3">
              <StampBadge pool="Blade Pool" event="Breakpoint" />
              <p className="text-muted-foreground [font:var(--riprap-mono-label)]">
                Olympia Convention Centre, London · 15-17 November 2026
              </p>
            </div>
          </Settle>
          <Settle delay={60}>
            <h1 className="tracking-(--riprap-tracking-mega) text-ink [font:var(--riprap-display-md)] sm:[font:var(--riprap-display-xl)]">
              Get stabbed with friends.
            </h1>
          </Settle>
          <Settle delay={120}>
            <p className="max-w-[36rem] leading-relaxed text-body [font:var(--riprap-body-md)]">
              $20 buys you into the weirdest hedge at Breakpoint: up to $2,000 out in the worst
              case, every cent back if nothing does, then the pool dissolves. This is not insurance.
              It's $20 and emotional support with a payout cap.
            </p>
          </Settle>
          <Settle delay={150}>
            {/* the odds — mock actuarial table; jokes here, real numbers elsewhere */}
            <div data-slot="odds" className="max-w-[36rem]">
              <table className="w-full border-collapse">
                <caption className="mb-2 text-left uppercase tracking-(--riprap-tracking-stamp) text-muted-soft [font:var(--riprap-mono-label)]">
                  The odds
                </caption>
                <tbody>
                  {(
                    [
                      ["You get stabbed at Breakpoint", "statistically negligible"],
                      ["Accidental eye contact on the Tube", "certain"],
                      ["The pool dissolves on schedule", "100% — it's a program"],
                      ["You send this page to the group chat", "high"],
                    ] as const
                  ).map(([event, odds]) => (
                    <tr key={event} className="border-t border-hairline">
                      <th className="py-2 pr-6 text-left font-normal text-body [font:var(--riprap-body-sm)]">
                        {event}
                      </th>
                      <td className="py-2 text-right font-mono text-sm text-muted-foreground">
                        {odds}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Settle>
          <Settle delay={180} className="pt-(--riprap-space-sm)">
            <div className="flex flex-col gap-4" data-slot="tier-picker">
              <p className="uppercase tracking-(--riprap-tracking-stamp) text-muted-soft [font:var(--riprap-mono-label)]">
                Choose your coverage — policy §5
              </p>
              {/* three stops, exactly TIERS.length; value is a tier index */}
              <Slider
                value={[tierIndex]}
                min={0}
                max={TIERS.length - 1}
                step={1}
                aria-label="Coverage tier"
                onValueChange={(v) => setTierIndex(v[0] ?? DEFAULT_TIER)}
                className="max-w-[36rem]"
              />
              <div className="flex max-w-[36rem] justify-between">
                {TIERS.map((t, i) => (
                  <span
                    key={t.name}
                    data-num
                    className={`font-mono text-sm transition-colors duration-[160ms] ease-out ${
                      i === tierIndex ? "text-ink" : "text-muted-soft"
                    }`}
                  >
                    {usd(t.fee)}
                  </span>
                ))}
              </div>
              <p data-num className="font-mono text-base text-ink">
                {tier.name} · {usd(tier.fee)} entry · up to {usd(tier.cap)} maximum payout
              </p>
              <p className="text-muted-soft [font:var(--riprap-mono-label)]">
                {TIER_NOTES[tierIndex]}
              </p>
            </div>
          </Settle>
          <Settle delay={240}>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" data-participate>
                  Chip in {usd(tier.fee)}
                </Button>
              </DialogTrigger>
              <DialogContent>
                <DialogHeader>
                  <DialogTitle data-tier-request>
                    {tier.name} — {usd(tier.fee)} entry
                  </DialogTitle>
                  <DialogDescription>
                    Join the waitlist for the Blade Pool. Nothing is charged today; the pool opens
                    for entry closer to the event.
                  </DialogDescription>
                </DialogHeader>
                <Waitlist />
              </DialogContent>
            </Dialog>
          </Settle>
        </div>
      </SectionBand>
    </div>
  );
}
