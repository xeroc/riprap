// useClaimPreflight — the wizard's step 0 and the #/app entry action's gate
// (CLAIM-WIZARD §3, copy doc § /app/file-claim "Step 0 preflight"): all
// chain reads, no user input. Order is the spec's: Member PDA exists →
// rights_stake > 0 → !has_pending → now < claims_close_at → fee ATA ≥
// min_jury_size × fee_per_juror (live subaccord read — never a constant).
// The first failure wins and renders its honest copy state.

import {
  fetchMaybeDepositorByOwner,
  findAssociatedTokenAddress,
  type Member,
  type Mutual,
  tokenBalanceOrZero,
} from "@riprap/hanse";
import { useCluster, useWallet } from "@solana/connector";
import type { Address } from "@solana/kit";
import { useQuery } from "@tanstack/react-query";
import { fetchSubaccordMaybe } from "@useaccord/sdk";

import { resolveMutualAddress } from "../../pool/mutual";
import { useMutual } from "../../pool/useMutual";
import { useClusterRpc } from "../../shared/rpc";
import { useMembership } from "../useMembership";

/** Why filing is blocked — each kind maps to one copy-doc line set. */
export type PreflightBlock =
  | { kind: "not-member" }
  | { kind: "no-rights-stake" }
  | { kind: "claim-open" }
  | { kind: "window-closed"; closedAt: bigint }
  | {
      kind: "fee-short";
      /** The fee, micro USDC: min_jury_size × fee_per_juror (live). */
      feeMicro: bigint;
      /** The wallet's fee-mint ATA balance (missing ATA = 0), micro. */
      balanceMicro: bigint;
      minJurySize: number;
      feePerJuror: bigint;
    }
  | { kind: "no-sol" };

/** Everything the review step restates after the gates pass. */
export interface PreflightPass {
  mutual: Mutual;
  member: Member;
  /** min_jury_size × fee_per_juror, micro USDC — the live subaccord read. */
  feeMicro: bigint;
  minJurySize: number;
  feePerJuror: bigint;
  claimsCloseAt: bigint;
  /** sub.evidence_operator — feeds operator discovery (CLAIM-WIZARD §8). */
  evidenceOperator: Address;
}

export type ClaimPreflight =
  | { state: "loading" }
  | { state: "not-found" }
  /** `source` picks the shared /app copy line (cluster vs membership). */
  | { state: "error"; source: "cluster" | "membership"; retry: () => void }
  | { state: "blocked"; block: PreflightBlock }
  | { state: "pass"; pass: PreflightPass };

export function useClaimPreflight(): ClaimPreflight {
  const { isLocal, isMainnet, isDevnet } = useCluster();
  const clusterRpc = useClusterRpc();
  const mutualAddress = resolveMutualAddress({ isLocal, isMainnet, isDevnet });
  const { account } = useWallet();
  const mutualQuery = useMutual();
  const membership = useMembership();

  const mutualReady = mutualQuery.state === "ready" ? mutualQuery.mutual : null;
  const member = membership.state === "ready" ? membership.member : null;

  // The money reads need the mutual (pool, feeMint, subaccord) — one batched
  // query so a single retry state covers them all.
  const moneyEnabled =
    clusterRpc !== null &&
    mutualAddress !== undefined &&
    account !== null &&
    mutualReady !== null &&
    member !== null;

  const money = useQuery({
    queryKey: ["claim-preflight", clusterRpc?.endpoint, mutualAddress, account],
    queryFn: async () => {
      if (!clusterRpc || !mutualReady || account === null) {
        throw new Error("claim-preflight prerequisites disappeared mid-flight");
      }
      const [depositor, subaccord, feeAta] = await Promise.all([
        fetchMaybeDepositorByOwner(clusterRpc.rpc, { pool: mutualReady.pool, owner: account }),
        fetchSubaccordMaybe(clusterRpc.rpc, mutualReady.subaccord),
        findAssociatedTokenAddress(mutualReady.feeMint, account),
      ]);
      const feeBalance = await tokenBalanceOrZero(clusterRpc.rpc, feeAta);
      const { value: solBalance } = await clusterRpc.rpc.getBalance(account).send();
      return {
        rightsStake: depositor.exists ? depositor.data.rightsStake : 0n,
        minJurySize: subaccord.exists ? subaccord.data.minJurySize : null,
        feePerJuror: subaccord.exists ? subaccord.data.feePerJuror : null,
        evidenceOperator: subaccord.exists ? subaccord.data.evidenceOperator : null,
        feeBalance,
        solBalance,
      };
    },
    enabled: moneyEnabled,
    retry: 1,
  });

  if (mutualQuery.state === "not-found") return { state: "not-found" };
  if (mutualQuery.state === "loading" || membership.state === "off") {
    return { state: "loading" };
  }
  if (mutualQuery.state === "error") {
    return { state: "error", source: "cluster", retry: mutualQuery.retry };
  }
  if (membership.state === "loading") return { state: "loading" };
  if (membership.state === "error") {
    return { state: "error", source: "membership", retry: membership.retry };
  }
  if (member === null || mutualReady === null) {
    return { state: "blocked", block: { kind: "not-member" } };
  }

  // Gates over the settled reads — the spec §3 order, first failure wins.
  if (!moneyEnabled || money.isPending) return { state: "loading" };
  if (money.isError) {
    return { state: "error", source: "cluster", retry: () => void money.refetch() };
  }
  const reads = money.data;
  if (reads.rightsStake <= 0n) return { state: "blocked", block: { kind: "no-rights-stake" } };
  if (member.hasPendingClaim) return { state: "blocked", block: { kind: "claim-open" } };
  if (Date.now() / 1000 >= Number(mutualReady.claimsCloseAt)) {
    return {
      state: "blocked",
      block: { kind: "window-closed", closedAt: mutualReady.claimsCloseAt },
    };
  }
  if (reads.minJurySize === null || reads.feePerJuror === null || reads.evidenceOperator === null) {
    // The subaccord the mutual created is unreadable — an error state, not a
    // fake zero fee.
    return { state: "error", source: "cluster", retry: () => void money.refetch() };
  }
  const feeMicro = BigInt(reads.minJurySize) * reads.feePerJuror;
  if (reads.feeBalance < feeMicro) {
    return {
      state: "blocked",
      block: {
        kind: "fee-short",
        feeMicro,
        balanceMicro: reads.feeBalance,
        minJurySize: reads.minJurySize,
        feePerJuror: reads.feePerJuror,
      },
    };
  }
  if (reads.solBalance <= 0n) return { state: "blocked", block: { kind: "no-sol" } };

  return {
    state: "pass",
    pass: {
      mutual: mutualReady,
      member,
      feeMicro,
      minJurySize: reads.minJurySize,
      feePerJuror: reads.feePerJuror,
      claimsCloseAt: mutualReady.claimsCloseAt,
      evidenceOperator: reads.evidenceOperator,
    },
  };
}
