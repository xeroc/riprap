// /2026-breakpoint-blade-pool — the pool page hero, ludic-lite register (2026-09-05,
// landing-page.md §2026-breakpoint-blade-pool): one maximal headline, then a straight
// face. Numbers always real — since the on-chain wiring they render from
// mutual.tiers (policy §5 reference); while the chain can't answer they render
// {{PARAM}} mono placeholders, never static fallbacks (landing-page.md §
// "On-chain states + juror modal"). The comedy lives in the odds table and the
// tier labels, never in the math. "Mutual" stays off the page per the
// messaging-guide demotion.

import {
  Button,
  ClusterSelect,
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
  usd,
} from "@riprap/ui";
import { useCluster } from "@solana/connector";
import { useState } from "react";

import { Settle } from "../../components/Settle";
import { Waitlist } from "../../components/Waitlist";
import { formatUtc, poolTiers } from "../mutual";
import { useMutual } from "../useMutual";

// Policy §5 default: Standard is the middle tier (index 1 of exactly three).
const DEFAULT_TIER = 1;

// One caption per tier, indexed like mutual.tiers. Copy only — every number
// in this file renders through usd() from the chain's mutual.tiers.
const TIER_NOTES = ["you're probably fine", "the group-chat special", "you've read the news"];

// Kit data law: unknown values render as mono {{PARAM}} placeholders.
const PARAM = "{{PARAM}}";

/** The inline cluster switch for the not-live empty state (copy doc § on-chain states). */
function ClusterSwitch() {
  const { clusters, cluster, setCluster } = useCluster();
  return (
    <ClusterSelect
      className="w-44"
      clusters={clusters.map((c) => ({ value: c.id, label: c.label }))}
      value={cluster?.id}
      onValueChange={(value) => void setCluster(value as (typeof clusters)[number]["id"])}
    />
  );
}

export function PoolHero() {
  const [tierIndex, setTierIndex] = useState(DEFAULT_TIER);
  const mutualQuery = useMutual();
  const tiers = mutualQuery.state === "ready" ? poolTiers(mutualQuery.mutual) : null;
  const tier = tiers === null ? null : tiers[Math.min(tierIndex, tiers.length - 1)];
  // Hero subline numbers track the default (Standard) tier — {{PARAM}} until
  // the chain answers.
  const std = tiers === null ? null : tiers[Math.min(DEFAULT_TIER, tiers.length - 1)];
  const subFee = std ? usd(std.fee) : PARAM;
  const subCap = std ? usd(std.cap) : PARAM;

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
              <span data-num className="font-mono">
                {subFee}
              </span>{" "}
              buys you into the weirdest hedge at Breakpoint: up to{" "}
              <span data-num className="font-mono">
                {subCap}
              </span>{" "}
              out in the worst case, every cent back if nothing does, then the pool dissolves. This
              is not insurance. It's{" "}
              <span data-num className="font-mono">
                {subFee}
              </span>{" "}
              and emotional support with a payout cap.
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
              {mutualQuery.state === "ready" && tier !== null ? (
                <>
                  {/* three stops, exactly tiers.length; value is a tier index */}
                  <Slider
                    value={[Math.min(tierIndex, tiers === null ? 0 : tiers.length - 1)]}
                    min={0}
                    max={(tiers ?? []).length - 1}
                    step={1}
                    aria-label="Coverage tier"
                    onValueChange={(v) => setTierIndex(v[0] ?? DEFAULT_TIER)}
                    className="max-w-[36rem]"
                  />
                  <div className="flex max-w-[36rem] justify-between">
                    {(tiers ?? []).map((t, i) => (
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
                    {TIER_NOTES[Math.min(tierIndex, TIER_NOTES.length - 1)]}
                  </p>
                  {/* deposits window — deposits_close_at, chain truth */}
                  <p data-num className="font-mono text-xs text-muted-foreground">
                    entry closes {formatUtc(mutualQuery.mutual.depositsCloseAt)}
                  </p>
                </>
              ) : mutualQuery.state === "loading" ? (
                <>
                  <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
                    Reading the pool from the chain.
                  </p>
                  <Slider
                    disabled
                    value={[DEFAULT_TIER]}
                    min={0}
                    max={2}
                    step={1}
                    aria-label="Coverage tier"
                    className="max-w-[36rem]"
                  />
                  <div className="flex max-w-[36rem] justify-between" data-slot="tier-placeholders">
                    {[0, 1, 2].map((i) => (
                      <span key={i} data-num className="font-mono text-sm text-muted-soft">
                        {PARAM}
                      </span>
                    ))}
                  </div>
                  <p data-num className="font-mono text-base text-ink">
                    {PARAM}
                  </p>
                </>
              ) : mutualQuery.state === "error" ? (
                <>
                  <p className="text-ink [font:var(--riprap-body-md)]">
                    Couldn't reach the cluster.
                  </p>
                  <Button variant="outline" className="w-44" onClick={mutualQuery.retry}>
                    Try again
                  </Button>
                </>
              ) : (
                <>
                  <p className="text-ink [font:var(--riprap-body-md)]">Not live on this cluster</p>
                  <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
                    The Blade Pool isn't deployed on this network. Switch networks to find it.
                  </p>
                  <ClusterSwitch />
                </>
              )}
            </div>
          </Settle>
          <Settle delay={240}>
            {mutualQuery.state === "ready" ? (
              mutualQuery.depositsOpen && tier !== null ? (
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
                        Join the waitlist for the Blade Pool. Nothing is charged today; the pool
                        opens for entry closer to the event.
                      </DialogDescription>
                    </DialogHeader>
                    <Waitlist />
                  </DialogContent>
                </Dialog>
              ) : (
                <div className="flex max-w-[36rem] flex-col gap-2" data-slot="entry-closed">
                  <p className="text-ink [font:var(--riprap-body-md)]">Entry closed.</p>
                  <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
                    This pool stopped taking members. Claims, settlement, and dissolution follow the
                    policy.
                  </p>
                </div>
              )
            ) : mutualQuery.state === "loading" ? (
              <Button size="lg" disabled data-participate>
                Chip in {PARAM}
              </Button>
            ) : null}
          </Settle>
        </div>
      </SectionBand>
    </div>
  );
}
