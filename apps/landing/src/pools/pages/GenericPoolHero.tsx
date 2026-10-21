// GenericPoolHero — the offer hero every def-driven community pool renders
// (epic riprap-hs4r, D5): the marketing block (headline, blurb, logo, share)
// with kind-templated defaults where the def carries none, on the shared
// usePoolJoin machine. Numbers always real: chain tier while the chain
// answers, {{PARAM}} mono placeholders until it does, never static fallbacks.
// CoveredOverlay + PolicyAcceptNote parity with the hand-written heroes.
// Template copy is kind-level only (D8) and carries no numerals — the
// zero-numbers law holds; every figure is a chain read.
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
import { useCluster, useWallet } from "@solana/connector";
import { type ReactNode, useState } from "react";

import { Prose } from "../../components/Prose";
import { Settle } from "../../components/Settle";
import { JoinPrecheck } from "../../pool/sections/JoinPrecheck";
import { PolicyAcceptNote } from "../../pool/sections/PolicyAcceptNote";
import { ShareRow } from "../../pool/sections/ShareRow";
import { poolRouteId } from "../data";
import type { RiprapDef } from "../def/schema";
import type { PoolListing } from "../types";
import { ConnectWalletCta, HeroClusterSwitch } from "./heroChrome";
import { defaultTierIndex, joinPrecheck, usePoolJoin } from "./usePoolJoin";

const PARAM = "{{PARAM}}";

/** Kind-templated hero copy for defs without a marketing block — deadpan,
 * numberless; `{name}`/`{event}`/`{fee}`/`{cap}` fill from the def + chain. */
const KIND_COPY = {
  mutual: {
    headline: "One peril. One pool. It ends.",
    subline:
      "{fee} buys a defined payout if the qualifying event happens to you during the event window — up to {cap} out, every cent back if nothing does, then the pool dissolves. This is not insurance.",
    share:
      "I just entered {name} at {event}.\nUp to {cap} out if it lands. Unused funds come back.\nNo adjudicated request, no payout.\nI'm in. @riprapxyz",
  },
  bounty: {
    headline: "Do the thing. Get paid.",
    subline:
      "{fee} puts you on the roster: {cap} out for one confirmed qualifying act, adjudicated by a jury of members. No confirmed act, no payout; unused funds return when the event ends.",
    share:
      "I just entered {name} at {event}.\n{cap} for one confirmed act. Unused funds come back.\nNo adjudicated request, no payout.\nI'm in. @riprapxyz",
  },
} as const;

/** `{token}` fill — missing values (chain not answering) substitute empty and
 *  collapse the orphaned blank lines. */
export function fillTemplate(
  tpl: string,
  values: { name: string; event: string; fee: string; cap: string },
): string {
  return tpl
    .replaceAll("{name}", values.name)
    .replaceAll("{event}", values.event)
    .replaceAll("{fee}", values.fee)
    .replaceAll("{cap}", values.cap)
    .replace(/ *\n *(\n)+/g, "\n")
    .trim();
}

/** The join moment's share message — the def's marketing.share template, else
 *  the kind default. Unread figures drop out (numbers are never faked). */
export function buildShareText(def: RiprapDef): (fee: string | null, cap: string | null) => string {
  const kind = KIND_COPY[def.kind];
  return (fee, cap) =>
    fillTemplate(def.marketing?.share ?? kind.share, {
      name: def.name,
      event: def.marketing?.event ?? "",
      fee: fee ?? "",
      cap: cap ?? "",
    });
}
/** The def-driven offer half of the hero — stamp/when line, headline,
 * subline, the pool's own logo, and whatever join moment `below` carries.
 * The pool page runs it on the join machine; the #/create marketing
 * preview runs it stacked on the draft's def. Pure presentation: every
 * figure arrives as `fee`/`cap` strings from the caller (a chain read
 * there, doc bytes here) — this component invents no numbers. */
export function PoolHeroOffer({
  def,
  fee,
  cap,
  subline = true,
  headingLevel = 1,
  stacked = false,
  below,
}: {
  def: RiprapDef;
  fee: string;
  cap: string;
  /** suppress the subline (the covered state hides it on the pool page) */
  subline?: boolean;
  /** the preview demotes its headline below the page's own h1 */
  headingLevel?: 1 | 2;
  /** single-column layout for narrow containers (the wizard's preview) */
  stacked?: boolean;
  below?: ReactNode;
}) {
  const copy = KIND_COPY[def.kind];
  const Heading = headingLevel === 1 ? "h1" : "h2";
  const event = def.marketing?.event;
  const headline = def.marketing?.headline ?? copy.headline;
  const sublineText =
    def.marketing?.blurb !== undefined && def.marketing.blurb.length > 0
      ? def.marketing.blurb
      : fillTemplate(copy.subline, {
          name: def.name,
          event: event ?? "",
          fee,
          cap,
        });
  const when =
    def.period.venue !== undefined
      ? `${def.period.venue} · ${def.period.start}–${def.period.end}`
      : `${def.period.start}–${def.period.end}`;
  const logo = def.marketing?.logo;

  return (
    <div
      className={
        stacked
          ? "flex w-full flex-col gap-(--riprap-space-lg)"
          : "grid items-center gap-(--riprap-space-xl) lg:grid-cols-[minmax(0,1fr)_auto]"
      }
    >
      <div className="flex w-full flex-col gap-(--riprap-space-lg)">
        <Settle>
          <div className="flex flex-wrap items-center gap-3">
            <StampBadge pool={def.name} event={event ?? "Community"} />
            <p data-num className="text-muted-foreground [font:var(--riprap-mono-label)]">
              {when}
            </p>
          </div>
        </Settle>
        <Settle delay={60}>
          <Heading className="max-w-3xl tracking-(--riprap-tracking-mega) text-ink [font:var(--riprap-display-md)] sm:[font:var(--riprap-display-xl)]">
            {headline}
          </Heading>
        </Settle>
        {subline ? (
          <Settle delay={120}>
            <p className="max-w-[36rem] leading-relaxed text-body [font:var(--riprap-body-md)]">
              <Prose text={sublineText} />
            </p>
          </Settle>
        ) : null}
        {below}
      </div>
      {logo !== undefined ? (
        <aside
          className={
            stacked ? "w-full" : "lg:w-96 lg:border-l lg:border-hairline lg:pl-(--riprap-space-xl)"
          }
        >
          <Settle delay={150}>
            {/* the pool's own image, external link — hairline frame, contained */}
            <img
              src={logo}
              alt={`${def.name} — logo`}
              data-slot="pool-logo"
              loading="lazy"
              className="max-h-64 w-full border border-hairline bg-ground-soft object-contain p-4"
            />
          </Settle>
        </aside>
      ) : null}
    </div>
  );
}

const PHASE_LABELS: Record<"building" | "wallet-signing" | "confirming", string> = {
  building: "Building…",
  "wallet-signing": "Check your wallet…",
  confirming: "Confirming…",
};

export function GenericPoolHero({ listing, def }: { listing: PoolListing; def: RiprapDef }) {
  const { isConnected } = useWallet();
  const { isDevnet } = useCluster();
  const routeId = poolRouteId(listing);
  const shareText = buildShareText(def);

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
  const fee = tier !== null ? usd(tier.fee) : PARAM;
  const cap = tier !== null ? usd(tier.cap) : PARAM;

  return (
    <div className="relative">
      <HexBackdrop className="pointer-events-none absolute inset-0 z-0 size-full" />
      <SectionBand
        id="pool"
        tone="ground"
        className="relative z-10 bg-transparent pt-(--riprap-space-section)"
      >
        <PoolHeroOffer
          def={def}
          fee={fee}
          cap={cap}
          subline={!covered}
          below={
            <>
              <Settle delay={180} className="pt-(--riprap-space-sm) flex flex-col gap-4">
                {mutualQuery.state === "ready" && tier !== null ? (
                  <>
                    {!covered && listing.tiers.length > 1 ? (
                      <>
                        <Slider
                          value={[Math.min(shownIndex, tiers === null ? 0 : tiers.length - 1)]}
                          min={0}
                          max={(tiers ?? []).length - 1}
                          step={1}
                          aria-label="Tier"
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
                    ) : null}
                    <p data-num className="font-mono text-base text-ink">
                      {tier.name} · {usd(tier.fee)} entry · up to {usd(tier.cap)} maximum payout
                    </p>
                    {covered ? (
                      <div className="flex max-w-[36rem] flex-col gap-3" data-slot="covered">
                        <BadgeStamp data-num>Member — {tier.name}</BadgeStamp>
                        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
                          This wallet is in the pool. Your membership and requests live in{" "}
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
                          <PolicyAcceptNote poolName={def.name} href={`#/m/${routeId}`} />
                          {precheck !== null && <JoinPrecheck isDevnet={isDevnet} {...precheck} />}
                        </div>
                      ) : (
                        <div className="flex max-w-[36rem] flex-col gap-3">
                          <ConnectWalletCta
                            note={<PolicyAcceptNote poolName={def.name} href={`#/m/${routeId}`} />}
                          />
                        </div>
                      )
                    ) : (
                      <div className="flex max-w-[36rem] flex-col gap-2" data-slot="entry-closed">
                        <p className="text-ink [font:var(--riprap-body-md)]">Entry closed.</p>
                        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
                          This pool stopped taking members. Requests, settlement, and dissolution
                          follow the policy.
                        </p>
                      </div>
                    )}
                  </>
                ) : mutualQuery.state === "loading" ? (
                  <div className="flex flex-col gap-3">
                    <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
                      Reading the pool from the chain.
                    </p>
                    <Button size="lg" disabled data-participate>
                      Chip in {PARAM}
                    </Button>
                  </div>
                ) : mutualQuery.state === "error" ? (
                  <div className="flex max-w-[36rem] flex-col gap-2">
                    <p className="text-ink [font:var(--riprap-body-md)]">
                      Couldn't reach the cluster.
                    </p>
                    <Button variant="outline" className="w-44" onClick={mutualQuery.retry}>
                      Try again
                    </Button>
                  </div>
                ) : (
                  <div className="flex max-w-[36rem] flex-col gap-2" data-slot="not-live">
                    <p className="text-ink [font:var(--riprap-body-md)]">
                      Not live on this cluster
                    </p>
                    <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
                      The {def.name} isn't deployed on this network. Switch networks to find it.
                    </p>
                    <HeroClusterSwitch />
                  </div>
                )}
              </Settle>
              <CoveredOverlay
                open={join.coveredOverlay}
                onDismiss={join.dismissCovered}
                stamp={`Member — ${tier !== null ? tier.name : PARAM}`}
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
                  href: `#/app/adjudicate/${routeId}`,
                }}
                share={
                  <ShareRow
                    fee={tier !== null ? usd(tier.fee) : null}
                    cap={tier !== null ? usd(tier.cap) : null}
                    buildText={shareText}
                    url={`https://riprap.xyz#/m/${routeId}`}
                  />
                }
              />
            </>
          }
        />
      </SectionBand>
    </div>
  );
}
