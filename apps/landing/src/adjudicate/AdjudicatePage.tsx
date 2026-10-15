// #/app/adjudicate — the juror duty board + session shell (riprap-jfb5, spec
// §2–3), mutual-agnostic (2026-10-12): the board serves every pool the
// wallet joined (the /app store scan — one serve-panel + seat block per
// pool), the session resolves its pool from the dispute (Dispute.subaccord
// matched against the live mutuals) and its policy pack from the pool's
// directory entry. Serve-panel reads (stake status, min floor, fees),
// drawn-seat discovery with clock-derived phases, honest states, and the
// session route's not-your-seat gate. Reads-only v1 — the stake/withdraw
// write CTAs are the serve-panel bean's (riprap-fy3q), the wizard steps are
// later lanes. Copy source: meta/marketing/03-website-copy/landing-page.md
// § "/app/adjudicate" — rendered verbatim; unknown values render {{PARAM}}
// mono placeholders, never static numbers.

import { fetchMaybeMemberByOwner, type Member } from "@riprap/hanse";
import {
  AddressChip,
  BadgeStamp,
  Button,
  HexBackdrop,
  SectionBand,
  TextLink,
  usd,
} from "@riprap/ui";
import { useWallet } from "@solana/connector";
import type { Address } from "@solana/kit";
import { useQueries, useQuery, useQueryClient } from "@tanstack/react-query";
import { fetchMaybeDispute, findRoundPda, type Round } from "@useaccord/sdk";
import { useEffect, useState } from "react";
import { ClusterSwitch, ConnectWalletButton } from "../app/controls";
import { Settle } from "../components/Settle";
import { SiteNav } from "../components/SiteNav";
import { poolRoute } from "../mutuals/data";
import { usePoolDef } from "../mutuals/def/usePoolDef";
import { type LiveMutual, useMutualStore } from "../mutuals/store";
import { formatUtc, microToUsd } from "../pool/mutual";
import { useMinStake, useMinStakeMicro } from "../pool/useMinStake";
import { useClusterRpc } from "../shared/rpc";
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
 * (amount defaulted to the tier contribution floored at the live minimum,
 * §12) and `Withdraw fees`. Not staked is a state, not an error. No unstake /
 * reconcile (CLI). */
function ServePanel({
  stake,
  minStake,
  minStakeMicro,
  subaccord,
  wallet,
  defaultAmountMicro,
  attestation,
}: {
  stake: JurorStakeQuery;
  minStake: string;
  /** the live floor in micro-USDC — the stake form's default clamp */
  minStakeMicro: bigint | null;
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
          minStakeMicro={minStakeMicro}
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
 * not the dispute's current one. The route names no pool — the shell
 * resolves it from the dispute itself (Dispute.subaccord matched against
 * the live mutuals) and its pack from the pool's directory entry. Not drawn
 * for it — or it doesn't exist — is one honest state: evidence never loads
 * for a wallet that doesn't hold the seat (the daemon enforces it too). */
function SessionShell({
  session,
  wallet,
  pools,
}: {
  session: SessionRoute;
  wallet: Address;
  pools: LiveMutual[];
}) {
  const clusterRpc = useClusterRpc();
  const disputeQuery = useQuery({
    queryKey: ["dispute", clusterRpc?.endpoint, session.dispute],
    queryFn: () => {
      if (!clusterRpc) throw new Error("dispute read prerequisites disappeared mid-flight");
      return fetchMaybeDispute(clusterRpc.rpc, session.dispute as Address);
    },
    enabled: clusterRpc !== null,
    retry: 1,
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
  if (disputeQuery.isPending) {
    return (
      <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
        Reading the dispute from the chain.
      </p>
    );
  }
  if (disputeQuery.isError) {
    return (
      <div className="flex max-w-3xl flex-col gap-2">
        <p className="text-ink [font:var(--riprap-body-md)]">Couldn't reach the cluster.</p>
        <Button variant="outline" className="w-44" onClick={() => void disputeQuery.refetch()}>
          Try again
        </Button>
      </div>
    );
  }
  const dispute = disputeQuery.data;
  if (!dispute.exists) {
    return (
      <div className="flex max-w-3xl flex-col gap-2" data-slot="no-dispute">
        <h1 className="text-ink [font:var(--riprap-body-md)]">No such dispute on this cluster.</h1>
        <ClusterSwitch />
      </div>
    );
  }
  const pool = pools.find((p) => p.account.subaccord === dispute.data.subaccord);
  if (pool === undefined) {
    return (
      <div className="flex max-w-3xl flex-col gap-2" data-slot="pool-not-live">
        <h1 className="text-ink [font:var(--riprap-body-md)]">
          This dispute's pool isn't live on this cluster.
        </h1>
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
          Switch networks to find it.
        </p>
        <ClusterSwitch />
      </div>
    );
  }
  return <PoolSession pool={pool} session={session} round={round} wallet={wallet} />;
}

/** The session for one resolved pool. First-party pools resolve their policy
 *  pack from the directory entry; community pools (no entry) resolve theirs
 *  from the pool's anchored def — the registry's def path (epic
 *  riprap-hs4r). Every def refusal is an honest state, never a fallback. */
function PoolSession({
  pool,
  session,
  round,
  wallet,
}: {
  pool: LiveMutual;
  session: SessionRoute;
  round: Round;
  wallet: Address;
}) {
  const needsDef = pool.listing.adjudicationPolicy === undefined;
  const resolution = usePoolDef(needsDef ? pool.address : null);
  const def = resolution.state === "ready" ? resolution.def : undefined;
  const policy = adjudicationPolicyFor(pool.listing, def);
  const roundPda = useQuery({
    queryKey: ["round-pda", session.dispute, session.round],
    queryFn: () => findRoundPda({ dispute: session.dispute as Address, roundIdx: session.round }),
  });
  if (needsDef) {
    if (resolution.state === "mutual-loading" || resolution.state === "doc-loading") {
      return (
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
          Reading the pool's terms from the chain.
        </p>
      );
    }
  }
  if (policy === null) {
    return (
      <div className="flex max-w-3xl flex-col gap-2" data-slot="no-policy">
        <h1 className="text-ink [font:var(--riprap-body-md)]">
          No adjudication policy for this pool yet.
        </h1>
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
          This session can't run until the pool's policy ships.
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
          mutual={pool.address}
          subaccord={pool.account.subaccord}
          dispute={session.dispute as Address}
          roundAddress={(roundPda.data?.[0] ?? ("R".repeat(32) as Address)) as Address}
          round={round}
          wallet={wallet}
          policy={policy}
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

/** One joined pool's block: its name (→ its detail route) over its serve
 * panel and its seats — the pool's subaccord carries its own stake, its
 * claims their own draw pool (spec §3). */
function PoolBoard({
  pool,
  member,
  wallet,
}: {
  pool: LiveMutual;
  member: Member;
  wallet: Address;
}) {
  const subaccord = pool.account.subaccord;
  // Rules of hooks: every read runs before the early returns.
  const minStake = useMinStake(subaccord);
  const minStakeMicro = useMinStakeMicro(subaccord);
  const stake = useJurorStake({ subaccord, juror: wallet });
  const seats = useSeats({ mutual: pool.address, claimNonce: pool.account.claimNonce, wallet });
  const tiers = pool.account.tiers;
  const defaultAmountMicro = tiers[Math.min(member.tier, tiers.length - 1)]?.contribution ?? 0n;

  return (
    <section className="flex flex-col gap-(--riprap-space-md)" data-slot="pool-duty">
      <h2 className="text-ink [font:var(--riprap-body-md)]">
        <a
          href={poolRoute(pool.listing)}
          className="font-medium underline decoration-transparent underline-offset-4 transition-colors hover:decoration-current"
        >
          {pool.listing.name}
        </a>
      </h2>
      <ServePanel
        stake={stake}
        minStake={minStake}
        minStakeMicro={minStakeMicro}
        subaccord={subaccord}
        wallet={wallet}
        defaultAmountMicro={defaultAmountMicro}
        attestation={member.attestation}
      />
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
    </section>
  );
}

/** Connected board, mutual-agnostic: the /app store scan (every live pool) ×
 * this wallet's memberships — the /app shared states verbatim, then one
 * serve-panel + seat block per joined pool, or the session shell (copy doc
 * frame; no pool is named in the route — the memberships are the scope). */
function Board({ wallet, session }: { wallet: Address; session: SessionRoute | null }) {
  const store = useMutualStore();
  const clusterRpc = useClusterRpc();
  const queryClient = useQueryClient();
  const pools = store.state === "ready" ? store.pools : [];

  // The joined scan: one membership read per live pool. Keys mirror /app's
  // member surface exactly, so the two surfaces share this cache.
  const memberships = useQueries({
    queries: pools.map((pool) => ({
      queryKey: ["member", clusterRpc?.endpoint, pool.address, wallet],
      queryFn: () => {
        if (!clusterRpc) throw new Error("membership prerequisites disappeared mid-flight");
        return fetchMaybeMemberByOwner(clusterRpc.rpc, {
          mutual: pool.address,
          member: wallet,
        }).then((maybe) => (maybe.exists ? maybe.data : null));
      },
      enabled: clusterRpc !== null,
      retry: 1,
    })),
  });

  if (store.state === "off") {
    return (
      <div className="flex max-w-3xl flex-col gap-2" data-slot="not-live">
        <p className="text-ink [font:var(--riprap-body-md)]">Not live on this cluster</p>
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
          No pools are live on this network. Switch networks to find them.
        </p>
        <ClusterSwitch />
      </div>
    );
  }
  if (store.state === "error") {
    return (
      <div className="flex max-w-3xl flex-col gap-2">
        <p className="text-ink [font:var(--riprap-body-md)]">Couldn't reach the cluster.</p>
        <Button variant="outline" className="w-44" onClick={store.retry}>
          Try again
        </Button>
      </div>
    );
  }
  if (store.state === "loading") {
    return (
      <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
        Reading the pools from the chain.
      </p>
    );
  }
  if (pools.length === 0) {
    return (
      <p className="max-w-2xl leading-relaxed text-muted-foreground [font:var(--riprap-body-md)]">
        No pools are live on this cluster yet.
      </p>
    );
  }
  if (memberships.some((q) => q.isPending)) {
    return (
      <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
        Reading your membership from the chain.
      </p>
    );
  }
  const errored = memberships.find((q) => q.isError);
  if (errored !== undefined) {
    return (
      <div className="flex max-w-3xl flex-col gap-2">
        <p className="text-ink [font:var(--riprap-body-md)]">Couldn't read your membership.</p>
        <Button
          variant="outline"
          className="w-44"
          onClick={() => {
            // retry re-runs the membership reads (refetch is idempotent)
            for (const pool of pools) {
              void queryClient.refetchQueries({
                queryKey: ["member", clusterRpc?.endpoint, pool.address, wallet],
              });
            }
          }}
        >
          Try again
        </Button>
      </div>
    );
  }

  const joined = pools.flatMap((pool, i) => {
    const member = memberships[i].data ?? null;
    return member !== null ? [{ pool, member }] : [];
  });

  if (joined.length === 0) {
    return (
      <div className="flex max-w-3xl flex-col gap-2" data-slot="not-a-member">
        <h1 className="text-ink [font:var(--riprap-body-md)]">This wallet isn't in any pool.</h1>
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
          Membership opens on <TextLink href="#/mutuals">the pools</TextLink>.
        </p>
      </div>
    );
  }

  // member — the session route replaces the board list (copy doc: one
  // session per seat, deep-linkable).
  if (session !== null) {
    return <SessionShell session={session} wallet={wallet} pools={pools} />;
  }

  return (
    <div className="flex max-w-3xl flex-col gap-(--riprap-space-lg)" data-slot="board">
      <Settle>
        <h1 className="tracking-(--riprap-tracking-mega) text-ink [font:var(--riprap-display-sm)]">
          Jury duty
        </h1>
      </Settle>
      {joined.map(({ pool, member }) => (
        <PoolBoard key={pool.address} pool={pool} member={member} wallet={wallet} />
      ))}
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
      <SiteNav inApp />
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
