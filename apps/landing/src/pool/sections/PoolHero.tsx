// The Blade Pool's offer hero (#/2026-breakpoint-blade-pool, copy doc §
// hero verbatim): one maximal headline, then a straight face, the
// three-stop tier slider, and the one-tx chip-in. Numbers always real —
// they render from mutual.tiers; while the chain can't answer they render
// {{PARAM}} mono placeholders, never static fallbacks. The comedy lives in
// the odds table and the tier labels, never in the math. "Mutual" stays
// off the page per the messaging-guide demotion.
//
// Founder call 2026-10-07: heroes are per-pool components — this file is
// the Blade Pool's; the draft pools carry their own under
// mutuals/pages/*Hero.tsx. The join machine is shared (usePoolJoin); the
// copy and layout are not.
import {
  BadgeStamp,
  Button,
  CoveredOverlay,
  HexBackdrop,
  SectionBand,
  Slider,
  StampBadge,
  TextLink,
  usd,
} from "@riprap/ui";
import { useWallet } from "@solana/connector";
import { useState } from "react";

import { Prose } from "../../components/Prose";
import { Settle } from "../../components/Settle";
import { MUTUAL_EVENT, poolBySlug, poolRouteId } from "../../mutuals/data";
import { ConnectWalletCta, HeroClusterSwitch } from "../../mutuals/pages/heroChrome";
import { defaultTierIndex, joinPrecheck, usePoolJoin } from "../../mutuals/pages/usePoolJoin";
import type { MutualListing } from "../../mutuals/types";
import { SUPPORTERS, SupporterDiscs } from "../../sections/Supporters";
import { JoinPrecheck } from "./JoinPrecheck";
import { PolicyAcceptNote } from "./PolicyAcceptNote";
import { ShareRow } from "./ShareRow";

const BLADE = poolBySlug("blade-pool");
const PARAM = "{{PARAM}}";

/** The Blade Pool's share message (the 2026-09-24 rewrite; copy doc §
 * Covered overlay reconciliation pending — bean riprap-k9jl). Unread tier:
 * the figures fragments drop out — numbers are never faked. */
export function bladeShareText(fee: string | null, cap: string | null): string {
  const forFee = fee === null ? "" : ` for ${fee}`;
  const worst = cap === null ? "" : `\nWorst case: up to ${cap} out.`;
  return `I just bought the weirdest hedge at Breakpoint${forFee} 😳.

Get stabbed with friends. 🤯${worst}
Best case: every cent back.
Friends decide over the payouts.

I'm in. @riprapxyz`;
}

const ODDS: readonly (readonly [string, string])[] = [
  ["You going to Breakpoint in London", "you betcha"],
  ["Accidental eye contact on the Tube", "dead sure"],
  ["You get stabbed at Breakpoint", "barely a blip"],
  ["You send this page to your friends", "dead cert"],
];

// copy doc § Covered overlay: the shared URL is the printed pool path —
// the public/ stub keeps it working
const SHARE_URL = "https://riprap.xyz/#/2026-breakpoint-blade-pool";
const POLICY_HREF = "#/2026-breakpoint-blade-pool";

const PHASE_LABELS: Record<"building" | "wallet-signing" | "confirming", string> = {
  building: "Building…",
  "wallet-signing": "Check your wallet…",
  confirming: "Confirming…",
};

export function BladeHero({ listing = BLADE }: { listing?: MutualListing }) {
  const { isConnected } = useWallet();
  const [tierIndex, setTierIndex] = useState(defaultTierIndex(listing.tiers.length));
  const join = usePoolJoin(listing);
  const { mutualQuery, context, covered, memberTier, phase, poolAmount, poolTotal, minStake } =
    join;
  const tiers = join.tiers;
  const shownIndex = covered
    ? Math.min(memberTier?.tier ?? tierIndex, tiers?.length ?? 1)
    : tierIndex;
  const tier = tiers === null ? null : (tiers[Math.min(shownIndex, tiers.length - 1)] ?? null);
  const precheck =
    isConnected && context !== null && tier !== null
      ? joinPrecheck(context, shownIndex, tier)
      : null;
  const blocked = precheck !== null && (precheck.needsUsdc || precheck.insufficientSol);
  // Hero subline numbers track the default (Standard) tier
  const std =
    tiers === null ? null : tiers[Math.min(defaultTierIndex(tiers.length), tiers.length - 1)];
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
        {/* platform-hero split (2026-09-24): the headline stack left, the
            odds table a right rail — the h1 stays the first look; the
            supporter discs take the odds table's old slot under the subline
            (copy doc §5.6 + § pool page). */}
        <div className="grid items-center gap-(--riprap-space-xl) lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex flex-col gap-(--riprap-space-lg)">
            <Settle>
              <div className="flex flex-wrap items-center gap-3">
                <StampBadge pool={listing.name} event={MUTUAL_EVENT.event.split(" ")[0]} />
                <p className="text-muted-foreground [font:var(--riprap-mono-label)]">
                  {MUTUAL_EVENT.venue} · {MUTUAL_EVENT.window}
                </p>
              </div>
            </Settle>
            <Settle delay={60}>
              <h1 className="max-w-3xl tracking-(--riprap-tracking-mega) text-ink [font:var(--riprap-display-md)] sm:[font:var(--riprap-display-xl)]">
                Get stabbed with friends.
              </h1>
            </Settle>
            {/* the by-slider tier explainer hides once covered (copy doc §
            Covered, 2026-09-24) — nothing for sale to a member */}
            {covered ? null : (
              <Settle delay={120}>
                <p className="max-w-[36rem] leading-relaxed text-body [font:var(--riprap-body-md)]">
                  <Prose
                    text={`${subFee} buys you into the weirdest hedge at Breakpoint: up to ${subCap} out in the worst case, every cent back if nothing does, then the pool dissolves. This is not insurance. It's ${subFee} and emotional support with a payout cap.`}
                  />
                </p>
              </Settle>
            )}
            <Settle delay={150}>
              {/* supporters — the odds table's old slot; the committed discs
              render verbatim, nothing while the list is empty (kit data law) */}
              {SUPPORTERS.length > 0 ? (
                <div data-slot="supporters" className="max-w-[36rem]">
                  <p className="mb-2 uppercase tracking-(--riprap-tracking-stamp) text-muted-soft [font:var(--riprap-mono-label)]">
                    Friends
                  </p>
                  <SupporterDiscs />
                </div>
              ) : null}
            </Settle>
            <Settle delay={180} className="pt-(--riprap-space-sm) flex flex-col gap-4">
              {!covered && (
                <div className="flex flex-col gap-3" data-slot="tier-picker">
                  <p className="uppercase tracking-(--riprap-tracking-stamp) text-muted-soft [font:var(--riprap-mono-label)]">
                    Choose your coverage
                  </p>
                  {mutualQuery.state === "ready" && tier !== null ? null : mutualQuery.state ===
                    "loading" ? (
                    <>
                      <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
                        Reading the pool from the chain.
                      </p>
                      <Slider
                        disabled
                        value={[defaultTierIndex(listing.tiers.length)]}
                        min={0}
                        max={listing.tiers.length - 1}
                        step={1}
                        aria-label="Coverage tier"
                        className="max-w-[36rem]"
                      />
                      <div
                        className="flex max-w-[36rem] justify-between"
                        data-slot="tier-placeholders"
                      >
                        {listing.tiers.map((t) => (
                          <span key={t.name} data-num className="font-mono text-sm text-muted-soft">
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
                      <p className="text-ink [font:var(--riprap-body-md)]">
                        Not live on this cluster
                      </p>
                      <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
                        The {listing.name} isn't deployed on this network. Switch networks to find
                        it.
                      </p>
                      <HeroClusterSwitch />
                    </>
                  )}
                </div>
              )}
              {mutualQuery.state === "ready" && tier !== null ? (
                <>
                  {/* three stops, exactly tiers.length; value is a tier index.
                  The picker renders for every ready state — connected or not,
                  deposits open or closed: tiers are chain data, browsing them
                  never needed a wallet; once covered it hides entirely (copy
                  doc § Covered, 2026-09-24). */}
                  {!covered && (
                    <>
                      <Slider
                        value={[Math.min(shownIndex, tiers === null ? 0 : tiers.length - 1)]}
                        min={0}
                        max={(tiers ?? []).length - 1}
                        step={1}
                        aria-label="Coverage tier"
                        onValueChange={(v) =>
                          setTierIndex(v[0] ?? defaultTierIndex(tiers?.length ?? 1))
                        }
                        className="max-w-[36rem]"
                      />
                      <div className="flex max-w-[36rem] justify-between">
                        {(tiers ?? []).map((t, i) => (
                          <span
                            key={t.name}
                            data-num
                            className={`font-mono text-sm transition-colors duration-[160ms] ease-out ${
                              i === shownIndex ? "text-ink" : "text-muted-soft"
                            }`}
                          >
                            {usd(t.fee)}
                          </span>
                        ))}
                      </div>
                    </>
                  )}
                  <p data-num className="font-mono text-base text-ink">
                    {tier.name} · {usd(tier.fee)} entry · up to {usd(tier.cap)} maximum payout
                  </p>
                  {covered ? (
                    <div className="flex max-w-[36rem] flex-col gap-3" data-slot="covered">
                      <BadgeStamp data-num>Covered — {tier.name}</BadgeStamp>
                      <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
                        This wallet is in the pool. Your membership and claims live in{" "}
                        <TextLink href="#/app">the app</TextLink>.
                      </p>
                    </div>
                  ) : mutualQuery.depositsOpen ? (
                    isConnected ? (
                      <div className="flex max-w-[36rem] flex-col gap-3">
                        <Button
                          size="lg"
                          data-participate
                          disabled={phase !== "idle" || blocked}
                          onClick={() => void join.onChipIn(shownIndex)}
                        >
                          {phase === "idle" || phase === "covered"
                            ? `Chip in ${usd(tier.fee)}`
                            : PHASE_LABELS[phase]}
                        </Button>
                        <PolicyAcceptNote poolName={listing.name} href={POLICY_HREF} />
                        {precheck !== null && <JoinPrecheck isDevnet={false} {...precheck} />}
                      </div>
                    ) : (
                      <ConnectWalletCta
                        note={<PolicyAcceptNote poolName={listing.name} href={POLICY_HREF} />}
                      />
                    )
                  ) : (
                    <div className="flex max-w-[36rem] flex-col gap-2" data-slot="entry-closed">
                      <p className="text-ink [font:var(--riprap-body-md)]">Entry closed.</p>
                      <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
                        This pool stopped taking members. Claims, settlement, and dissolution follow
                        the policy.
                      </p>
                    </div>
                  )}
                </>
              ) : mutualQuery.state === "loading" ? (
                <Button size="lg" disabled data-participate>
                  Chip in {PARAM}
                </Button>
              ) : null}
            </Settle>
            {/* Covered overlay — copy doc § Covered overlay: the join moment;
            copy renders verbatim, figures chain-formatted, total last. */}
            <CoveredOverlay
              open={join.coveredOverlay}
              onDismiss={join.dismissCovered}
              stamp={`Covered — ${tier !== null ? tier.name : PARAM}`}
              headline="Welcome, friend!"
              figures={[
                <span key="fee">
                  <span data-num className="font-mono">
                    {tier !== null ? usd(tier.fee) : PARAM}
                  </span>{" "}
                  in
                </span>,
                <span key="cap">
                  up to{" "}
                  <span data-num className="font-mono">
                    {tier !== null ? usd(tier.cap) : PARAM}
                  </span>{" "}
                  out
                </span>,
                poolAmount > 2500 && (
                  <span key="total">
                    pool holds{" "}
                    <span data-num className="font-mono">
                      {poolTotal}
                    </span>
                  </span>
                ),
              ]}
              juror={{
                label: "Juror",
                body: (
                  <>
                    Stake{" "}
                    <span data-num className="font-mono">
                      {minStake}
                    </span>
                    , get drawn to read the evidence, get paid when coherent. Unstake anytime.
                  </>
                ),
                action: "Become a juror",
                href: `#/app/adjudicate/${poolRouteId(listing)}`,
              }}
              share={
                <ShareRow
                  fee={tier !== null ? usd(tier.fee) : null}
                  cap={tier !== null ? usd(tier.cap) : null}
                  buildText={bladeShareText}
                  url={SHARE_URL}
                />
              }
            />
          </div>
          {/* the odds — mock actuarial table; jokes here, real numbers
              elsewhere. A hairline-separated right rail since 2024-09-24. */}
          <aside className="lg:w-96 lg:border-l lg:border-hairline lg:pl-(--riprap-space-xl)">
            <Settle delay={150}>
              <div data-slot="odds">
                <table className="w-full border-collapse">
                  <caption className="mb-3 text-left uppercase tracking-(--riprap-tracking-stamp) text-muted-soft [font:var(--riprap-mono-label)]">
                    The odds
                  </caption>
                  <tbody>
                    {ODDS.map(([event, odds]) => (
                      <tr key={event} className="border-t border-hairline">
                        <th className="py-3 pr-4 text-left align-top font-normal leading-snug text-body [font:var(--riprap-body-sm)]">
                          {event}
                        </th>
                        <td className="py-3 pl-2 text-right align-top font-mono text-sm leading-snug text-muted-foreground whitespace-nowrap">
                          {odds}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>{" "}
            </Settle>
          </aside>
        </div>
      </SectionBand>
    </div>
  );
}
