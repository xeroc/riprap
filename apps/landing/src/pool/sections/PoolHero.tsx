// /2026-breakpoint-blade-pool — the pool page hero, ludic-lite register (2026-09-05,
// landing-page.md §2026-breakpoint-blade-pool): one maximal headline, then a straight
// face. Numbers always real — since the on-chain wiring they render from
// mutual.tiers (policy §5 reference); while the chain can't answer they render
// {{PARAM}} mono placeholders, never static fallbacks (landing-page.md §
// "On-chain states + juror modal"). The comedy lives in the odds table and the
// tier labels, never in the math. "Mutual" stays off the page per the
// messaging-guide demotion.
//
// The chip-in is the one-transaction join (milestone riprap-9ehc HANDOFF §4):
// idle → building (buildJoinInstructions) → wallet-signing (sign) → confirming
// (broadcast) → covered. Any throw → one-line toast (describeError) → idle with
// the join context refetched. An existing member renders the Covered stamp — a
// state, never an error toast.

import { buildJoinInstructions } from "@riprap/hanse";
import {
  BadgeStamp,
  Button,
  ClusterSelect,
  HexBackdrop,
  JurorUpsellDialog,
  SectionBand,
  Slider,
  StampBadge,
  TextLink,
  usd,
  WalletDialog,
} from "@riprap/ui";
import {
  useCluster,
  useConnectWallet,
  useDisconnectWallet,
  useWallet,
  useWalletConnectors,
  type WalletConnectorId,
} from "@solana/connector";
import { useState } from "react";
import { toast } from "sonner";

import { Settle } from "../../components/Settle";
import { useHanseEnv } from "../../shared/rpc";
import { describeError, sendInstruction, TransactionSendError } from "../../shared/transaction";
import { formatUtc, microToUsd, poolTiers, resolveMutualAddress } from "../mutual";
import { useJoinContext } from "../useJoinContext";
import { useMinStake } from "../useMinStake";
import { useMutual } from "../useMutual";
import { JoinPrecheck } from "./JoinPrecheck";

// Policy §5 default: Standard is the middle tier (index 1 of exactly three).
const DEFAULT_TIER = 1;

// One caption per tier, indexed like mutual.tiers. Copy only — every number
// in this file renders through usd() from the chain's mutual.tiers.
const TIER_NOTES = ["you're probably fine", "the group-chat special", "you've read the news"];

// Kit data law: unknown values render as mono {{PARAM}} placeholders.
const PARAM = "{{PARAM}}";

// The hero state machine (copy doc § on-chain states; HANDOFF §4).
type Phase = "idle" | "building" | "wallet-signing" | "confirming" | "covered";

// Copy doc: "Failure: one-line toast read from the program logs; unmapped
// fallback `The transaction didn't go through. Try again.`" — Error-likes go
// through describeError; anything unmappable gets the fallback, never an
// invented reason.
function joinFailureMessage(err: unknown): string {
  if (err instanceof TransactionSendError || err instanceof Error) return describeError(err);
  return "The transaction didn't go through. Try again.";
}

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

/** `Connect a wallet to chip in` — opens the kit's props-driven wallet picker
 *  wired to the ConnectorKit hooks (the kit itself stays Solana-free). */
function ConnectWalletCta() {
  const [open, setOpen] = useState(false);
  const connectors = useWalletConnectors();
  const { connect } = useConnectWallet();
  const { disconnect } = useDisconnectWallet();
  const { isConnected, account } = useWallet();

  return (
    <>
      <Button size="lg" data-participate onClick={() => setOpen(true)}>
        Connect a wallet to chip in
      </Button>
      <WalletDialog
        open={open}
        onOpenChange={setOpen}
        connectors={connectors.map((c) => ({ id: c.id, name: c.name }))}
        onConnect={(id) => {
          setOpen(false);
          void connect(id as WalletConnectorId);
        }}
        connected={isConnected}
        address={account ?? undefined}
        onDisconnect={() => void disconnect()}
      />
    </>
  );
}

export function PoolHero() {
  const [tierIndex, setTierIndex] = useState(DEFAULT_TIER);
  const [phase, setPhase] = useState<Phase>("idle");
  // Fires exactly once per wallet per pool — on join confirmation only
  // (copy doc § juror modal): one join per mutual means no persistence
  // machinery; a reload re-enters via alreadyMember and never re-fires.
  const [jurorUpsell, setJurorUpsell] = useState(false);
  const mutualQuery = useMutual();
  const joinQuery = useJoinContext();
  const hanseEnv = useHanseEnv();
  const { isConnected } = useWallet();
  const { isLocal, isMainnet, isDevnet } = useCluster();
  const mutualAddress = resolveMutualAddress({ isLocal, isMainnet, isDevnet });

  const tiers = mutualQuery.state === "ready" ? poolTiers(mutualQuery.mutual) : null;
  const context = joinQuery.state === "ready" ? joinQuery.context : null;
  const minStake = useMinStake(context?.mutual.data.subaccord ?? null);
  // alreadyMember is a STATE (copy doc § Covered): the Member PDA's tier wins;
  // between confirmation and the context refetch, the tier just joined shows.
  const memberTier = context?.alreadyMember ?? (phase === "covered" ? { tier: tierIndex } : null);
  const covered = memberTier !== null;
  const shownIndex = covered ? Math.min(memberTier.tier, tiers?.length ?? 1) : tierIndex;
  const tier = tiers === null ? null : (tiers[Math.min(shownIndex, tiers.length - 1)] ?? null);
  // Hero subline numbers track the default (Standard) tier — {{PARAM}} until
  // the chain answers.
  const std = tiers === null ? null : tiers[Math.min(DEFAULT_TIER, tiers.length - 1)];
  const subFee = std ? usd(std.fee) : PARAM;
  const subCap = std ? usd(std.cap) : PARAM;

  // Per-tier affordability is the page's call (join.ts): the context carries
  // both balances; the disabled reason tracks the SELECTED tier.
  const precheck =
    isConnected && context !== null && tiers !== null && tier !== null
      ? {
          needsUsdc:
            context.depositBalance <
            (context.mutual.data.tiers[Math.min(shownIndex, context.mutual.data.tiers.length - 1)]
              ?.contribution ?? 0n),
          balanceUsd: microToUsd(context.depositBalance),
          tierName: tier.name,
          feeUsd: tier.fee,
          insufficientSol: context.reason === "insufficient-sol",
        }
      : null;
  const blocked = precheck !== null && (precheck.needsUsdc || precheck.insufficientSol);

  async function onChipIn() {
    if (phase !== "idle" || !hanseEnv || mutualAddress === undefined || tiers === null) return;
    setPhase("building");
    try {
      const instructions = await buildJoinInstructions(hanseEnv.rpc, {
        mutual: mutualAddress,
        tier: tierIndex,
        member: hanseEnv.signer,
      });
      setPhase("wallet-signing");
      await sendInstruction(
        hanseEnv.rpc,
        hanseEnv.rpcSubscriptions,
        hanseEnv.signer,
        instructions,
        () => setPhase("confirming"),
      );
      setPhase("covered");
      setJurorUpsell(true);
    } catch (err) {
      toast.error(joinFailureMessage(err));
      setPhase("idle");
      joinQuery.refetch();
    }
  }

  const phaseLabel: Record<Exclude<Phase, "idle" | "covered">, string> = {
    building: "Building…",
    "wallet-signing": "Check your wallet…",
    confirming: "Confirming…",
  };

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
              {/* prominence pulse — two accent hairline rings emanate from the stamp's
                  border box (2.8s, staggered); pure opacity/scale overlay, and the
                  stamp itself never moves. Reduced motion: rings never show. */}
              <span className="relative inline-flex" data-slot="stamp-pulse">
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-none border border-(--riprap-accent) opacity-0 motion-safe:animate-[stamp-pulse_2800ms_cubic-bezier(0,0,0.2,1)_infinite]"
                />
                <span
                  aria-hidden="true"
                  className="absolute inset-0 rounded-none border border-(--riprap-accent) opacity-0 motion-safe:animate-[stamp-pulse_2800ms_cubic-bezier(0,0,0.2,1)_infinite_1400ms]"
                />
                <StampBadge pool="Blade Pool" event="Breakpoint" />
              </span>
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
            <div className="flex flex-col gap-4 mb-4" data-slot="tier-picker">
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
            {mutualQuery.state === "ready" ? (
              covered ? (
                <div className="flex max-w-[36rem] flex-col gap-3" data-slot="covered">
                  <BadgeStamp data-num>Covered — {tier !== null ? tier.name : PARAM}</BadgeStamp>
                  <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
                    This wallet is in the pool. Your membership and claims live in{" "}
                    <TextLink href="#/app">the app</TextLink>.
                  </p>
                </div>
              ) : mutualQuery.depositsOpen && tier !== null ? (
                isConnected ? (
                  <>
                    {/* three stops, exactly tiers.length; value is a tier index;
                      locked once this wallet is covered (copy doc § Covered) */}
                    <Slider
                      disabled={covered}
                      value={[Math.min(shownIndex, tiers === null ? 0 : tiers.length - 1)]}
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
                            i === shownIndex ? "text-ink" : "text-muted-soft"
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
                      {TIER_NOTES[Math.min(shownIndex, TIER_NOTES.length - 1)]}
                    </p>
                    {/* deposits window — deposits_close_at, chain truth */}
                    <p data-num className="font-mono text-xs text-muted-foreground">
                      entry closes {formatUtc(mutualQuery.mutual.depositsCloseAt)}
                    </p>

                    <div className="flex max-w-[36rem] flex-col gap-3">
                      <Button
                        size="lg"
                        data-participate
                        disabled={phase !== "idle" || blocked}
                        onClick={() => void onChipIn()}
                      >
                        {phase === "idle" || phase === "covered"
                          ? `Chip in ${usd(tier.fee)}`
                          : phaseLabel[phase]}
                      </Button>
                      {precheck !== null && <JoinPrecheck isDevnet={isDevnet} {...precheck} />}
                    </div>
                  </>
                ) : (
                  <ConnectWalletCta />
                )
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
          {/* Juror upsell — copy doc § juror modal (D2): fires once, on join
            confirmation; OK (or Escape / overlay) is the only exit. */}
          <JurorUpsellDialog
            open={jurorUpsell}
            onOk={() => setJurorUpsell(false)}
            minStake={minStake}
            title="The pool needs jurors."
            body={
              <>
                Claims are settled by members who stake{" "}
                <span data-num className="font-mono">
                  {minStake}
                </span>{" "}
                USDC and get drawn to read the evidence. Coherent jurors get paid; incoherent ones
                get slashed. You can unstake anytime. Staking will open in the app.
              </>
            }
            okLabel="Noted"
          />
        </div>
      </SectionBand>
    </div>
  );
}
