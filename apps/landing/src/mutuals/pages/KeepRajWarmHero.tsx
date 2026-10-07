// KeepRajWarmHero — #/m/keep-raj-warm's offer hero: Operation Keep Raj Warm's offer hero (bounty).
// This pool's own copy, layout, and join flow (founder call 2026-10-07:
// per-pool hero components, not a shared template). One tier, one fixed
// fee — no tier picker: the chip-in CTA states the price directly.
// Numbers always real: from the mutual's on-chain tier while the chain
// answers, {{PARAM}} mono placeholders until it does, never static
// fallbacks. Description + share message authored 2026-10-07 (copy-doc
// pass pending).

import {
  BadgeStamp,
  Button,
  CoveredOverlay,
  HexBackdrop,
  SectionBand,
  StampBadge,
  TextLink,
  usd,
} from "@riprap/ui";
import { useCluster, useWallet } from "@solana/connector";

import { Prose } from "../../components/Prose";
import { Settle } from "../../components/Settle";
import { JoinPrecheck } from "../../pool/sections/JoinPrecheck";
import { PolicyAcceptNote } from "../../pool/sections/PolicyAcceptNote";
import { ShareRow } from "../../pool/sections/ShareRow";
import { SUPPORTERS, SupporterDiscs } from "../../sections/Supporters";
import { MUTUAL_EVENT, poolBySlug, poolRoute, poolRouteId } from "../data";
import { ConnectWalletCta, HeroClusterSwitch } from "./heroChrome";
import { joinPrecheck, usePoolJoin } from "./usePoolJoin";

const LISTING = poolBySlug("keep-raj-warm");
const PARAM = "{{PARAM}}";

/** The join moment's share message — the blade skeleton, this pool's hook. */
export function shareText(fee: string | null, cap: string | null): string {
  const forFee = fee === null ? "" : ` for ${fee}`;
  const worst = cap === null ? "" : `\n${cap} if it lands.`;
  return `I just entered the weirdest bounty at Breakpoint${forFee} 😳.

Bring Raj the hot drink he asked for. ☕${worst}
No confirmed act, no payout — unused funds come back.

I'm in. @riprapxyz`;
}

const ODDS: readonly (readonly [string, string])[] = [
  ["Raj wants a coffee", "eventually"],
  ["You're holding one when it happens", "now we're talking"],
  ["It's still hot at the hand-off", "the whole game"],
  ["You send this page to your friends", "dead cert"],
];

const PAGE_URL = `https://riprap.xyz${poolRoute(LISTING)}`;
const POLICY_HREF = poolRoute(LISTING);

const PHASE_LABELS: Record<"building" | "wallet-signing" | "confirming", string> = {
  building: "Building…",
  "wallet-signing": "Check your wallet…",
  confirming: "Confirming…",
};

export function KeepRajWarmHero() {
  const { isConnected } = useWallet();
  const { isDevnet } = useCluster();
  const join = usePoolJoin(LISTING);
  // one tier, index 0 — the machine joins tier 0 and the facts line reads it
  const TIER_INDEX = 0;
  const tier = join.tiers === null ? null : (join.tiers[0] ?? null);
  const { mutualQuery, context, covered, memberTier, phase, poolAmount, poolTotal, minStake } =
    join;
  const precheck =
    isConnected && context !== null && tier !== null
      ? joinPrecheck(context, TIER_INDEX, tier)
      : null;
  const blocked = precheck !== null && (precheck.needsUsdc || precheck.insufficientSol);
  const fee = tier !== null ? usd(tier.fee) : PARAM;
  const cap = tier !== null ? usd(tier.cap) : PARAM;
  const shownTier =
    tier === null
      ? null
      : covered && memberTier !== null
        ? (join.tiers?.[Math.min(memberTier.tier, join.tiers.length - 1)] ?? tier)
        : tier;

  return (
    <div className="relative">
      <HexBackdrop className="pointer-events-none absolute inset-0 z-0 size-full" />
      <SectionBand
        id="pool"
        tone="ground"
        className="relative z-10 bg-transparent pt-(--riprap-space-section)"
      >
        <div className="grid items-center gap-(--riprap-space-xl) lg:grid-cols-[minmax(0,1fr)_auto]">
          <div className="flex flex-col gap-(--riprap-space-lg)">
            <Settle>
              <div className="flex flex-wrap items-center gap-3">
                <StampBadge pool={LISTING.name} event={MUTUAL_EVENT.event.split(" ")[0]} />
                <p className="text-muted-foreground [font:var(--riprap-mono-label)]">
                  {MUTUAL_EVENT.venue} · {MUTUAL_EVENT.window}
                </p>
              </div>
            </Settle>
            <Settle delay={60}>
              <h1 className="max-w-3xl tracking-(--riprap-tracking-mega) text-ink [font:var(--riprap-display-md)] sm:[font:var(--riprap-display-xl)]">
                Bring Raj a hot drink. Get paid.
              </h1>
            </Settle>
            {covered ? null : (
              <Settle delay={120}>
                <p className="max-w-[36rem] leading-relaxed text-body [font:var(--riprap-body-md)]">
                  <Prose
                    text={`Raj will want a coffee at some point — that's a certainty; the drink is the variable. ${fee} puts you on the delivery roster: ${cap} out for one confirmed hand-off, a hot drink Raj asked for, hand to hand, still hot, confirmed by Raj himself. No confirmed act, no payout; unused funds return when the event ends. This is not a raffle. It's ${fee} and a thermos.`}
                  />
                </p>
              </Settle>
            )}
            <Settle delay={150}>
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
              {mutualQuery.state === "ready" && shownTier !== null ? (
                <>
                  <p data-num className="font-mono text-base text-ink">
                    {shownTier.name} · {usd(shownTier.fee)} entry · up to {usd(shownTier.cap)}{" "}
                    maximum payout
                  </p>
                  {covered ? (
                    <div className="flex max-w-[36rem] flex-col gap-3" data-slot="covered">
                      <BadgeStamp data-num>Covered — {shownTier.name}</BadgeStamp>
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
                          onClick={() => void join.onChipIn(TIER_INDEX)}
                        >
                          {phase === "idle" || phase === "covered"
                            ? `Chip in ${fee}`
                            : PHASE_LABELS[phase]}
                        </Button>
                        <PolicyAcceptNote poolName={LISTING.name} href={POLICY_HREF} />
                        {precheck !== null && <JoinPrecheck isDevnet={isDevnet} {...precheck} />}
                      </div>
                    ) : (
                      <ConnectWalletCta
                        note={<PolicyAcceptNote poolName={LISTING.name} href={POLICY_HREF} />}
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
                  <p className="text-ink [font:var(--riprap-body-md)]">Not live on this cluster</p>
                  <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
                    The {LISTING.name} isn't deployed on this network. Switch networks to find it.
                  </p>
                  <HeroClusterSwitch />
                </div>
              )}
            </Settle>
            <CoveredOverlay
              open={join.coveredOverlay}
              onDismiss={join.dismissCovered}
              stamp={`Covered — ${shownTier !== null ? shownTier.name : PARAM}`}
              headline="Welcome, friend!"
              figures={[
                <span key="fee">
                  <span data-num className="font-mono">
                    {shownTier !== null ? usd(shownTier.fee) : PARAM}
                  </span>{" "}
                  in
                </span>,
                <span key="cap">
                  up to{" "}
                  <span data-num className="font-mono">
                    {shownTier !== null ? usd(shownTier.cap) : PARAM}
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
                href: `#/app/adjudicate/${poolRouteId(LISTING)}`,
              }}
              share={
                <ShareRow
                  fee={shownTier !== null ? usd(shownTier.fee) : null}
                  cap={shownTier !== null ? usd(shownTier.cap) : null}
                  buildText={shareText}
                  url={PAGE_URL}
                />
              }
            />
          </div>
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
              </div>
            </Settle>
          </aside>
        </div>
      </SectionBand>
    </div>
  );
}
