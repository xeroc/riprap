// usePoolJoin — the join machine every pool hero runs (HANDOFF §4): the
// reads (mutual, join context, pool total, stake floor), the one-transaction
// chip-in (buildJoinInstructions → wallet-signing → confirming → covered),
// and the covered moment's once-per-session overlay gate. Rendering is NOT
// here — each pool's hero component owns its own JSX, copy, and layout
// (founder call 2026-10-07: heroes are per-pool components, not a template).
//
// The listing drives the chain binding (resolvePoolAddress — env override,
// else the pinned pubkey) and the tier names (§5 table).
import { buildJoinInstructions, type JoinContext } from "@riprap/hanse";
import { useWallet } from "@solana/connector";
import type { Address } from "@solana/kit";
import { useQueryClient } from "@tanstack/react-query";
import { useCallback, useEffect, useRef, useState } from "react";
import { toast } from "sonner";
import { microToUsd, poolTiers } from "../../pool/mutual";
import { useJoinContext } from "../../pool/useJoinContext";
import { useMinStake } from "../../pool/useMinStake";
import { useMutual } from "../../pool/useMutual";
import { usePoolTotal } from "../../pool/usePoolTotal";
import { useHanseEnv } from "../../shared/rpc";
import { describeError, sendInstruction, TransactionSendError } from "../../shared/transaction";
import type { MutualListing } from "../types";

/** The hero state machine (copy doc § on-chain states; HANDOFF §4). */
export type JoinPhase = "idle" | "building" | "wallet-signing" | "confirming" | "covered";

/** Policy §5 default tier: the middle of whatever the pool carries. */
export function defaultTierIndex(tierCount: number): number {
  return Math.floor((tierCount - 1) / 2);
}

/** Copy doc: "Failure: one-line toast read from the program logs; unmapped
 * fallback `The transaction didn't go through. Try again.`" — Error-likes go
 * through describeError; anything unmappable gets the fallback, never an
 * invented reason. */
function joinFailureMessage(err: unknown): string {
  if (err instanceof TransactionSendError) return describeError(err);
  return "The transaction didn't go through. Try again.";
}

/** Per-tier affordability (join.ts): the context carries both balances; the
 *  disabled reason tracks the tier the hero is about to join. `tier` is the
 *  renderable tier (name/fee from the §5 table + chain prices). */
export function joinPrecheck(
  context: JoinContext,
  tierIndex: number,
  tier: { name: string; fee: number },
): {
  needsUsdc: boolean;
  balanceUsd: number;
  tierName: string;
  feeUsd: number;
  insufficientSol: boolean;
} {
  const chainTier =
    context.mutual.data.tiers[Math.min(tierIndex, context.mutual.data.tiers.length - 1)];
  return {
    needsUsdc: context.depositBalance < (chainTier?.contribution ?? 0n),
    balanceUsd: microToUsd(context.depositBalance),
    tierName: tier.name,
    feeUsd: tier.fee,
    insufficientSol: context.reason === "insufficient-sol",
  };
}

/** Everything a pool hero needs to render its offer and join flow. */
export function usePoolJoin(listing: MutualListing) {
  const [phase, setPhase] = useState<JoinPhase>("idle");
  // Covered overlay (copy doc § Covered overlay): fires on the first covered
  // read of a browser session per wallet — a fresh join confirmation or a
  // connecting member's first read; once per session (sessionStorage gate),
  // then Escape/Continue dismisses to the inline covered state.
  const [coveredOverlay, setCoveredOverlay] = useState(false);
  const hanseEnv = useHanseEnv();
  const queryClient = useQueryClient();
  const { account, isConnected } = useWallet();

  // pins only (founder call 2026-10-07): the listing's pinned pubkey is the
  // address, tried on whatever cluster is active — the route id or the
  // chain scan put us here. Unpinned drafts resolve null: read nothing,
  // render not-live, never the static map.
  const address = listing.pubkey as Address | undefined;
  const mutualQuery = useMutual(address ?? null);
  const joinQuery = useJoinContext(address ?? null);
  const context = joinQuery.state === "ready" ? joinQuery.context : null;
  const minStake = useMinStake(context?.mutual.data.subaccord ?? null);
  const { displayAmount: poolTotal, amount: poolAmount } = usePoolTotal(
    context?.mutual.data.pool ?? null,
  );
  // the tier the machine last joined or read — the covered stamp's tier
  const tierRef = useRef(defaultTierIndex(listing.tiers.length));

  /** One-tx chip-in at `tier` — any throw toasts one line and re-reads the
   *  join context (the member PDA may or may not exist after the failure). */
  const onChipIn = useCallback(
    async (tier: number) => {
      if (phase !== "idle" || !hanseEnv || address === undefined) return;
      tierRef.current = tier;
      setPhase("building");
      try {
        const instructions = await buildJoinInstructions(hanseEnv.rpc, {
          mutual: address,
          tier,
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
        // the overlay's "pool holds" figure must include this deposit —
        // invalidate before the covered effect opens the moment.
        void queryClient.invalidateQueries({ queryKey: ["pool-total"] });
      } catch (err) {
        toast.error(joinFailureMessage(err));
        setPhase("idle");
        joinQuery.refetch();
      }
    },
    [address, hanseEnv, joinQuery, phase, queryClient],
  );

  // alreadyMember is a STATE (copy doc § Covered): the Member PDA's tier
  // wins; between confirmation and the context refetch, the tier just
  // joined shows.
  const memberTier =
    context?.alreadyMember ?? (phase === "covered" ? { tier: tierRef.current } : null);
  const covered = memberTier !== null;

  // The overlay trigger (copy doc § Covered overlay): join confirmation and
  // the connecting-member read both land here — covered flips true.
  useEffect(() => {
    if (!covered || !isConnected || account === null) return;
    const key = `riprap:covered:${account}`;
    if (sessionStorage.getItem(key) !== null) return;
    sessionStorage.setItem(key, "1");
    setCoveredOverlay(true);
  }, [covered, isConnected, account]);

  return {
    address,
    mutualQuery,
    joinQuery,
    context,
    minStake,
    poolTotal,
    poolAmount,
    phase,
    onChipIn,
    covered,
    memberTier,
    coveredOverlay,
    dismissCovered: () => setCoveredOverlay(false),
    tiers:
      mutualQuery.state === "ready"
        ? poolTiers(
            mutualQuery.mutual,
            listing.tiers.map((t) => t.name),
          )
        : null,
  };
}
