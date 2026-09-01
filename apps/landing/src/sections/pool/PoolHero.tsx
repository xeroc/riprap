// /breakpoint-2026 — the pool page hero: the offer (policy §1, §2), the tier
// slider (policy §5 — TIERS from the kit, never hardcoded), and Participate.
// Every string below quotes or compresses the policy doc; numbers render
// through usd() in mono per the type law.
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
                Micro mutual · Olympia Convention Centre, London · 15-17 November 2026
              </p>
            </div>
          </Settle>
          <Settle delay={60}>
            <h1 className="tracking-(--riprap-tracking-mega) text-ink [font:var(--riprap-display-md)] sm:[font:var(--riprap-display-xl)]">
              Knife-assault coverage for one conference.
            </h1>
          </Settle>
          <Settle delay={120}>
            <p className="max-w-[36rem] leading-relaxed text-body [font:var(--riprap-body-md)]">
              One-time pool. Members pay a fixed entry fee against one narrowly defined peril: knife
              assault during Breakpoint 2026. Approved claims pay up to the tier cap — never more
              than the pool holds. Unused funds return to members pro-rata, then the pool dissolves.
              No reserve, no profit.
            </p>
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
                className="max-w-md"
              />
              <div className="flex max-w-md justify-between">
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
            </div>
          </Settle>
          <Settle delay={240}>
            <Dialog>
              <DialogTrigger asChild>
                <Button size="lg" data-participate>
                  Participate
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
