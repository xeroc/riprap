// useSeats — the duty board's seat discovery (riprap-jfb5, spec §3): every
// claim on the mutual (nonce scan, unfiltered by wallet — the draw pool is
// the whole mutual) × each claim's Dispute.currentRound × Round.jurors
// membership for the connected wallet. Reads-only; every PDA derivation
// stays in the SDKs (@useaccord/sdk for accord accounts, @riprap/hanse for
// claims) — none happens here.
// ponytail: O(claims) claim reads + O(disputes) dispute/round reads — fine at
// pilot scale (tens); memcmp scans at hundreds+ (same note as useClaims).

import { fetchMaybeClaimByNonce } from "@riprap/hanse";
import type { Address } from "@solana/kit";
import { useQuery } from "@tanstack/react-query";
import {
  type Dispute,
  DisputeState,
  fetchMaybeDispute,
  fetchMaybeRound,
  findRoundPda,
  type Round,
} from "@useaccord/sdk";

import { useClusterRpc } from "../shared/rpc";

/** One drawn seat: the wallet is in this round's juror list. */
export interface Seat {
  dispute: Address;
  roundIdx: number;
  round: Round;
  disputeState: DisputeState;
  /** Prior round (round ≥ 1) for the tally line; null for round 0 / missing. */
  prior: Round | null;
}

/** Everything the scan needs; null (state "off") until mutual + wallet. */
export interface SeatsSeeds {
  mutual: Address;
  claimNonce: bigint;
  wallet: Address;
}

export type SeatsQuery =
  | { state: "off" }
  | { state: "loading" }
  | { state: "error"; retry: () => void }
  | { state: "ready"; seats: Seat[] };

/** One dispute's current-round lookup result, pre-filter (pure input). */
export interface SeatScan {
  dispute: Address;
  currentRound: number;
  state: DisputeState;
  round: Round | null;
  prior: Round | null;
}

/** Pure: the scans that are this wallet's drawn seats (spec §3 membership:
 * `round.jurors.includes(wallet)`). */
export function drawnSeats(scans: SeatScan[], wallet: Address): Seat[] {
  return scans
    .filter((s) => s.round?.jurors.includes(wallet))
    .map((s) => ({
      dispute: s.dispute,
      roundIdx: s.currentRound,
      round: s.round as Round,
      disputeState: s.state,
      prior: s.prior,
    }));
}

/** DisputeState → the terminal seat label (copy doc: `Seat concluded —
 * resolved · failed · final`); null = still live (clock phase applies). */
export function terminalLabel(state: DisputeState): string | null {
  switch (state) {
    case DisputeState.RoundResolved:
      return "resolved";
    case DisputeState.Failed:
      return "failed";
    case DisputeState.Final:
    case DisputeState.Closed:
      return "final";
    default:
      return null;
  }
}

/** Prior-round tally (copy doc: `Prior round — {{approve}} approve · {{deny}}
 * deny`). Option recipe hanse-opt/v1: Approve = 0, Deny = 1; unrevealed
 * seats (NO_VOTE sentinel or unset) count for neither. */
export function tallyOf(round: Round): { approve: number; deny: number } {
  let approve = 0;
  let deny = 0;
  for (const vote of round.reveals) {
    if (vote === 0n) approve += 1;
    else if (vote === 1n) deny += 1;
  }
  return { approve, deny };
}

export function useSeats(seeds: SeatsSeeds | null): SeatsQuery {
  const clusterRpc = useClusterRpc();

  const query = useQuery({
    // claimNonce in the key: a newly filed claim changes the count and must
    // re-scan (same convention as useClaims).
    queryKey: [
      "seats",
      clusterRpc?.endpoint,
      seeds?.mutual,
      seeds?.claimNonce.toString(),
      seeds?.wallet,
    ],
    queryFn: async () => {
      if (!clusterRpc || seeds === null) {
        throw new Error("seats prerequisites disappeared mid-flight");
      }
      // 1. every claim on the mutual — the draw pool, unfiltered.
      const nonces = Array.from({ length: Number(seeds.claimNonce) }, (_, i) => BigInt(i));
      const claims = await Promise.all(
        nonces.map((nonce) =>
          fetchMaybeClaimByNonce(clusterRpc.rpc, { mutual: seeds.mutual, nonce }),
        ),
      );
      const disputes = [...new Set(claims.filter((c) => c.exists).map((c) => c.data.dispute))];
      // 2. each dispute's current round.
      const disputeMaybes = await Promise.all(
        disputes.map((d) => fetchMaybeDispute(clusterRpc.rpc, d)),
      );
      // 3. current round (+ prior round for the round ≥ 1 tally line).
      const scans = await Promise.all(
        disputeMaybes.map(async (m, i) => {
          const dispute = disputes[i] as Address;
          if (!m.exists) return null;
          const scan = await scanRound(clusterRpc.rpc, dispute, m.data);
          return scan;
        }),
      );
      return drawnSeats(
        scans.filter((s): s is SeatScan => s !== null),
        seeds.wallet,
      );
    },
    enabled: clusterRpc !== null && seeds !== null,
    retry: 1,
  });

  if (seeds === null) return { state: "off" };
  if (query.isPending) return { state: "loading" };
  if (query.isError) return { state: "error", retry: () => void query.refetch() };
  return { state: "ready", seats: query.data };
}

async function scanRound(
  rpc: Parameters<typeof fetchMaybeRound>[0],
  dispute: Address,
  data: Dispute,
): Promise<SeatScan> {
  const round = await fetchRoundAt(rpc, dispute, data.currentRound);
  const prior =
    data.currentRound >= 1 ? await fetchRoundAt(rpc, dispute, data.currentRound - 1) : null;
  return { dispute, currentRound: data.currentRound, state: data.state, round, prior };
}

async function fetchRoundAt(
  rpc: Parameters<typeof fetchMaybeRound>[0],
  dispute: Address,
  roundIdx: number,
): Promise<Round | null> {
  const [pda] = await findRoundPda({ dispute, roundIdx });
  const maybe = await fetchMaybeRound(rpc, pda);
  return maybe.exists ? maybe.data : null;
}

/** The session shell's single read (spec §2: session route
 * `#/app/adjudicate/:dispute/:round`): the ROUNTED round — the URL's, not the
 * dispute's current one — for the not-your-seat gate and the phase clock. */
export type RoundSeatQuery =
  | { state: "loading" }
  | { state: "error"; retry: () => void }
  | { state: "ready"; round: Round | null };

export function useRoundSeat(dispute: Address, roundIdx: number): RoundSeatQuery {
  const clusterRpc = useClusterRpc();
  const query = useQuery({
    queryKey: ["round", clusterRpc?.endpoint, dispute, roundIdx],
    queryFn: async () => {
      if (!clusterRpc) throw new Error("round prerequisites disappeared mid-flight");
      return fetchRoundAt(clusterRpc.rpc, dispute, roundIdx);
    },
    enabled: clusterRpc !== null,
    retry: 1,
  });

  if (query.isPending) return { state: "loading" };
  if (query.isError) return { state: "error", retry: () => void query.refetch() };
  return { state: "ready", round: query.data };
}
