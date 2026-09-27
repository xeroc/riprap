// #/app/adjudicate — the juror duty board + session shell (riprap-jfb5, spec
// §2–3): serve-panel reads (stake status, min floor, fees), drawn-seat
// discovery with clock-derived phases, honest states, and the session route's
// not-your-seat gate. Reads-only v1 — the stake/withdraw write CTAs are the
// serve-panel bean's (riprap-fy3q), the wizard steps are later lanes.
// Copy source: meta/marketing/03-website-copy/landing-page.md § "/app/adjudicate"
// — rendered verbatim; unknown values render {{PARAM}} mono placeholders,
// never static numbers.

import {
  AddressChip,
  BadgeStamp,
  Button,
  HexBackdrop,
  SectionBand,
  TextLink,
  usd,
} from "@riprap/ui";
import { useCluster, useWallet } from "@solana/connector";
import type { Address } from "@solana/kit";
import { useQuery } from "@tanstack/react-query";
import { findRoundPda } from "@useaccord/sdk";
import { useEffect, useState } from "react";

import { AppNavControls, ClusterSwitch, ConnectWalletButton } from "../app/controls";
import { useMembership } from "../app/useMembership";
import { Settle } from "../components/Settle";
import { SiteNav } from "../components/SiteNav";
import { formatUtc, microToUsd, resolveMutualAddress } from "../pool/mutual";
import { useMinStake } from "../pool/useMinStake";
import { useMutual } from "../pool/useMutual";
import { currentDecryptDelivery, localDeliveryKeyStore } from "./delivery";
import { phaseLabel, seatPhase } from "./phase";
import { adjudicationPolicyFor } from "./policies";
import { StakeToServe, WithdrawFees } from "./ServeActions";
import { SessionWizard } from "./SessionWizard";
import { type JurorStakeQuery, useJurorStake } from "./useJurorStake";
import { type Seat, tallyOf, terminalLabel, useRoundSeat, useSeats } from "./useSeats";

/** The session route params the router parsed off
 * `#/app/adjudicate/:dispute/:round`. */
export interface SessionRoute {
  dispute: string;
  round: number;
}

/** The 1s clock tick (spec §2): runs only while a live window is on screen —
 * awaiting-ruling and terminal seats read the same frozen facts for free. */
function useNow(active: boolean): number {
  const [now, setNow] = useState(() => Date.now() / 1000);
  useEffect(() => {
    if (!active) return;
    const timer = setInterval(() => setNow(Date.now() / 1000), 1000);
    return () => clearInterval(timer);
  }, [active]);
  return now;
}

/** The mono phase-clock line (copy doc: `review closes {{review_end}}` …
 * `awaiting ruling`). Terminal seats never reach this — they render the
 * concluded stamp instead. The 1s tick runs only while a window can still
 * close; past reveal-end the frozen facts are the final state. */
function PhaseClock({ round }: { round: Seat["round"] }) {
  const live = Date.now() / 1000 < Number(round.revealEnd);
  const now = useNow(live);
  const phase = seatPhase(round, BigInt(Math.floor(now)));
  if (phase.kind === "awaiting-ruling") {
    return (
      <p data-num className="font-mono text-sm text-muted-foreground">
        awaiting ruling
      </p>
    );
  }
  return (
    <p data-num className="font-mono text-sm text-muted-foreground">
      {phaseLabel(phase)} closes {formatUtc(phase.end)}
    </p>
  );
}

/** One drawn seat (copy doc duty board card): stamp, dispute + panel size,
 * phase clock or concluded state, prior-round tally, the session link. */
function SeatCard({ seat }: { seat: Seat }) {
  const terminal = terminalLabel(seat.disputeState);
  const prior = seat.prior !== null ? tallyOf(seat.prior) : null;
  return (
    <div
      data-slot="seat"
      className="flex max-w-[36rem] flex-col gap-2 border-t border-hairline pt-(--riprap-space-md)"
    >
      <h3>
        <BadgeStamp data-num>Seat — round {seat.roundIdx}</BadgeStamp>
      </h3>
      <p data-num className="font-mono text-sm text-ink">
        <AddressChip address={seat.dispute} /> · {seat.round.jurors.length} jurors
      </p>
      {terminal !== null ? (
        <p data-num className="font-mono text-sm text-muted-foreground">
          Seat concluded — {terminal}
        </p>
      ) : (
        <PhaseClock round={seat.round} />
      )}
      {seat.roundIdx >= 1 && prior !== null && (
        <p data-num className="font-mono text-sm text-muted-foreground">
          Prior round — {prior.approve} approve · {prior.deny} deny
        </p>
      )}
      {!terminal && (
        <Button asChild variant="outline" size="sm" className="w-44">
          <a href={`#/app/adjudicate/${seat.dispute}/${seat.roundIdx}`}>Enter session</a>
        </Button>
      )}
    </div>
  );
}

/** The serve panel (copy doc § /app/adjudicate): stake status vs the live
 * floor, draw weight, earned fees, and the write actions — `Stake to serve`
 * (amount defaulted to the tier contribution, §12) and `Withdraw fees`.
 * Not staked is a state, not an error. No unstake / reconcile (CLI). */
function ServePanel({
  stake,
  minStake,
  subaccord,
  wallet,
  defaultAmountMicro,
  attestation,
}: {
  stake: JurorStakeQuery;
  minStake: string;
  subaccord: Address;
  wallet: Address;
  defaultAmountMicro: bigint;
  attestation: Address;
}) {
  if (stake.state !== "ready") return null; // supplementary read; retries itself
  if (stake.stake === null) {
    return (
      <div data-slot="serve" className="flex max-w-[36rem] flex-col gap-3">
        <p className="text-ink [font:var(--riprap-body-md)]">You're not staked for jury duty.</p>
        <p data-num className="font-mono text-sm text-muted-foreground">
          Minimum {minStake} USDC.
        </p>
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
          Stake is draw weight — more stake, better odds of a seat.
        </p>
        <StakeToServe
          subaccord={subaccord}
          wallet={wallet}
          defaultAmountMicro={defaultAmountMicro}
          attestation={attestation}
        />
      </div>
    );
  }
  return (
    <div data-slot="serve" className="flex max-w-[36rem] flex-col gap-3">
      <p data-num className="font-mono text-sm text-ink">
        Staked {usd(microToUsd(stake.stake.staked))} USDC · minimum {minStake} USDC
      </p>
      <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
        Stake is draw weight — more stake, better odds of a seat.
      </p>
      <p data-num className="font-mono text-sm text-muted-foreground">
        Fees earned {usd(microToUsd(stake.stake.feesEarned))} USDC
      </p>
      <WithdrawFees subaccord={subaccord} wallet={wallet} feesEarned={stake.stake.feesEarned} />
    </div>
  );
}

/** The session route (copy doc § /app/adjudicate session): the routed round,
 * not the dispute's current one. Not drawn for it — or it doesn't exist — is
 * one honest state: evidence never loads for a wallet that doesn't hold the
 * seat (the daemon enforces it too). */
function SessionShell({
  session,
  wallet,
  mutual,
  subaccord,
}: {
  session: SessionRoute;
  wallet: Address;
  mutual: Address;
  subaccord: Address;
}) {
  const roundPda = useQuery({
    queryKey: ["round-pda", session.dispute, session.round],
    queryFn: () => findRoundPda({ dispute: session.dispute as Address, roundIdx: session.round }),
  });
  const roundSeat = useRoundSeat(session.dispute as Address, session.round);
  if (roundSeat.state === "loading") {
    return (
      <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
        Reading your seats from the chain.
      </p>
    );
  }
  if (roundSeat.state === "error") {
    return (
      <div className="flex max-w-3xl flex-col gap-2">
        <p className="text-ink [font:var(--riprap-body-md)]">Couldn't reach the cluster.</p>
        <Button variant="outline" className="w-44" onClick={roundSeat.retry}>
          Try again
        </Button>
      </div>
    );
  }
  const round = roundSeat.round;
  if (round === null || !round.jurors.includes(wallet)) {
    return (
      <div className="flex max-w-3xl flex-col gap-2" data-slot="not-your-seat">
        <h1 className="text-ink [font:var(--riprap-body-md)]">This seat isn't yours.</h1>
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
          Your wallet wasn't drawn for this round.
        </p>
      </div>
    );
  }
  return (
    <div className="flex max-w-3xl flex-col gap-(--riprap-space-md)" data-slot="session">
      <Settle>
        <h1 data-num className="font-mono text-lg text-ink">
          Round {round.roundIdx}
        </h1>
      </Settle>
      <Settle delay={60}>
        <p data-num className="font-mono text-sm text-muted-foreground">
          <AddressChip address={session.dispute} /> · {round.jurors.length} jurors
        </p>
      </Settle>
      <Settle delay={120}>
        <PhaseClock round={round} />
      </Settle>
      <Settle delay={180}>
        {/* The composed lock-step wizard. Seam-honest v1: the delivery-key
            registration interface is pending (spec §5/§9) — the package
            gate renders the no-key state until it lands; the live reads
            (amount, fee, ruling) wire with the shell's chain reads. */}
        <SessionWizard
          mutual={mutual}
          subaccord={subaccord}
          dispute={session.dispute as Address}
          roundAddress={(roundPda.data?.[0] ?? ("R".repeat(32) as Address)) as Address}
          round={round}
          wallet={wallet}
          policy={adjudicationPolicyFor(mutual)}
          verification={
            currentDecryptDelivery(localDeliveryKeyStore()) === null ? { state: "no-key" } : null
          }
          manifestSha256={null}
          slots={[]}
          amountMicro={null}
          feeEarnedMicro={null}
          ruling={null}
          nowSec={BigInt(Math.floor(Date.now() / 1000))}
          onRetry={() => {}}
          onExit={() => {
            window.location.hash = "#/app/adjudicate";
          }}
        />
      </Settle>
    </div>
  );
}

/** Connected board: shared mutual/membership states (copy doc frame, verbatim
 * with /app), then the serve panel + seat cards or the session shell. */
function Board({ wallet, session }: { wallet: Address; session: SessionRoute | null }) {
  const { isLocal, isMainnet, isDevnet } = useCluster();
  const mutualAddress = resolveMutualAddress({ isLocal, isMainnet, isDevnet });
  const mutualQuery = useMutual();
  const membership = useMembership();
  const member = membership.state === "ready" ? membership.member : null;

  // Rules of hooks: every read runs before the early returns.
  const subaccord = mutualQuery.state === "ready" ? mutualQuery.mutual.subaccord : null;
  const minStake = useMinStake(subaccord);
  const stake = useJurorStake(
    subaccord !== null && member !== null ? { subaccord, juror: wallet } : null,
  );
  const seats = useSeats(
    mutualQuery.state === "ready" && member !== null && mutualAddress !== undefined
      ? { mutual: mutualAddress, claimNonce: mutualQuery.mutual.claimNonce, wallet }
      : null,
  );

  if (mutualQuery.state === "not-found") {
    return (
      <div className="flex max-w-3xl flex-col gap-2" data-slot="not-live">
        <p className="text-ink [font:var(--riprap-body-md)]">Not live on this cluster</p>
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
          The Blade Pool isn't deployed on this network. Switch networks to find it.
        </p>
        <ClusterSwitch />
      </div>
    );
  }
  if (mutualQuery.state === "loading") {
    return (
      <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
        Reading the pool from the chain.
      </p>
    );
  }
  if (mutualQuery.state === "error") {
    return (
      <div className="flex max-w-3xl flex-col gap-2">
        <p className="text-ink [font:var(--riprap-body-md)]">Couldn't reach the cluster.</p>
        <Button variant="outline" className="w-44" onClick={mutualQuery.retry}>
          Try again
        </Button>
      </div>
    );
  }
  if (membership.state === "off" || membership.state === "loading") {
    return (
      <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
        Reading your membership from the chain.
      </p>
    );
  }
  if (membership.state === "error") {
    return (
      <div className="flex max-w-3xl flex-col gap-2">
        <p className="text-ink [font:var(--riprap-body-md)]">Couldn't read your membership.</p>
        <Button variant="outline" className="w-44" onClick={membership.retry}>
          Try again
        </Button>
      </div>
    );
  }
  if (member === null) {
    return (
      <div className="flex max-w-3xl flex-col gap-2" data-slot="not-a-member">
        <h1 className="text-ink [font:var(--riprap-body-md)]">This wallet isn't in the pool.</h1>
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
          Membership opens on <TextLink href="#/2026-breakpoint-blade-pool">the pool page</TextLink>
          .
        </p>
      </div>
    );
  }

  // member — the session route replaces the board list (copy doc: one
  // session per seat, deep-linkable).
  if (session !== null) {
    return (
      <SessionShell
        session={session}
        wallet={wallet}
        mutual={mutualAddress as Address}
        subaccord={mutualQuery.mutual.subaccord}
      />
    );
  }

  return (
    <div className="flex max-w-3xl flex-col gap-(--riprap-space-lg)" data-slot="board">
      <Settle>
        <h1 className="tracking-(--riprap-tracking-mega) text-ink [font:var(--riprap-display-sm)]">
          Jury duty
        </h1>
      </Settle>
      <Settle delay={60}>
        <ServePanel
          stake={stake}
          minStake={minStake}
          subaccord={mutualQuery.mutual.subaccord}
          wallet={wallet}
          defaultAmountMicro={
            mutualQuery.mutual.tiers[Math.min(member.tier, mutualQuery.mutual.tiers.length - 1)]
              ?.contribution ?? 0n
          }
          attestation={member.attestation}
        />
      </Settle>
      {seats.state === "loading" && (
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
          Reading your seats from the chain.
        </p>
      )}
      {seats.state === "error" && (
        <div className="flex max-w-3xl flex-col gap-2">
          <p className="text-ink [font:var(--riprap-body-md)]">Couldn't reach the cluster.</p>
          <Button variant="outline" className="w-44" onClick={seats.retry}>
            Try again
          </Button>
        </div>
      )}
      {seats.state === "ready" &&
        (seats.seats.length === 0 ? (
          stake.state === "ready" && stake.stake !== null ? (
            <div className="flex max-w-3xl flex-col gap-2" data-slot="no-seat">
              <p className="text-ink [font:var(--riprap-body-md)]">No seat drawn for you.</p>
              <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
                You stay in the draw.
              </p>
            </div>
          ) : null
        ) : (
          <div className="flex flex-col gap-(--riprap-space-md)">
            {seats.seats.map((seat) => (
              <SeatCard key={`${seat.dispute}:${seat.roundIdx}`} seat={seat} />
            ))}
          </div>
        ))}
    </div>
  );
}

/** The #/app jury-duty entry panel (copy doc § /app/adjudicate entry panel —
 * the #jurors panel's state layer): mechanic line + one entry state. Consumed
 * by AppPage's covered view; hooks run unconditionally, seeds gate the reads
 * (react-query shares the board's cache by key). */
export function JuryDutyPanel({
  subaccord,
  mutual,
  claimNonce,
  wallet,
}: {
  subaccord: Address | null;
  mutual: Address | null;
  claimNonce: bigint | null;
  wallet: Address;
}) {
  const minStake = useMinStake(subaccord);
  const stake = useJurorStake(subaccord !== null ? { subaccord, juror: wallet } : null);
  const seats = useSeats(
    mutual !== null && claimNonce !== null ? { mutual, claimNonce, wallet } : null,
  );

  return (
    <div id="jurors" data-slot="jurors" className="flex max-w-[36rem] scroll-mt-24 flex-col gap-2">
      <p className="uppercase tracking-(--riprap-tracking-stamp) text-muted-soft [font:var(--riprap-mono-label)]">
        Jurors
      </p>
      <p className="max-w-[36rem] leading-relaxed text-body [font:var(--riprap-body-sm)]">
        Claims are settled by members who stake{" "}
        <span data-num className="font-mono">
          {minStake}
        </span>{" "}
        USDC and get drawn to read the evidence. Coherent jurors get paid; incoherent ones get
        slashed. Unstake anytime.
      </p>
      {stake.state === "ready" &&
        (stake.stake === null ? (
          <div className="flex flex-col gap-2 pt-1">
            <p className="text-ink [font:var(--riprap-body-sm)]">
              You're not staked for jury duty.
            </p>
            <Button asChild variant="outline" size="sm" className="w-44">
              <a href="#/app/adjudicate">Stake to serve</a>
            </Button>
          </div>
        ) : seats.state === "ready" ? (
          seats.seats.length > 0 ? (
            <div className="flex flex-col gap-2 pt-1">
              <p className="text-ink [font:var(--riprap-body-sm)]">Seat drawn for you.</p>
              <Button asChild size="sm" className="w-44">
                <a href="#/app/adjudicate">Open jury duty</a>
              </Button>
            </div>
          ) : (
            <div className="flex flex-col gap-1 pt-1">
              <p className="text-ink [font:var(--riprap-body-sm)]">No seat drawn for you.</p>
              <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
                You stay in the draw. A drawn seat appears here.
              </p>
            </div>
          )
        ) : null)}
    </div>
  );
}

/** The connect gate (copy doc § /app/adjudicate frame). */
function JuryGate() {
  return (
    <div className="flex max-w-3xl flex-col gap-(--riprap-space-lg)">
      <Settle>
        <h1 className="tracking-(--riprap-tracking-mega) text-ink [font:var(--riprap-display-md)]">
          Jury duty
        </h1>
      </Settle>
      <Settle delay={60}>
        <p className="max-w-[36rem] leading-relaxed text-body [font:var(--riprap-body-md)]">
          Connect the wallet you joined with. Voting needs its signature.
        </p>
      </Settle>
      <Settle delay={120}>
        <ConnectWalletButton size="lg" data-participate label="Connect a wallet" />
      </Settle>
    </div>
  );
}

export function AdjudicatePage({ session = null }: { session?: SessionRoute | null }) {
  const { isConnected, account } = useWallet();
  const connected = isConnected && account !== null;

  return (
    <>
      <SiteNav actions={<AppNavControls />} />
      <main>
        <div className="relative">
          <HexBackdrop className="pointer-events-none absolute inset-0 z-0 size-full" />
          <SectionBand
            id="adjudicate"
            tone="ground"
            className="relative z-10 bg-transparent pt-(--riprap-space-section)"
          >
            {connected && account !== null ? (
              <Board wallet={account} session={session} />
            ) : (
              <JuryGate />
            )}
          </SectionBand>
        </div>
      </main>
    </>
  );
}
