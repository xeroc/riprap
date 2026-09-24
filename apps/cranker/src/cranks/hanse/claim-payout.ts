/**
 * claim_payout crank — the payout crank (ADR-0005): pays an approved claim
 * into the claimant's canonical ATA (they never sign) and burns the matching
 * rights stake. Permissionless in principle; for the pilot the on-chain gate
 * pins the cranker to mutual.authority (§2.10/§12) — the reconciler checks
 * that before emitting. Account assembly mirrors the CLI buildClaimPayout.
 */
import {
  fetchClaim,
  fetchMutual,
  findDepositorPda,
  getClaimPayoutInstructionAsync,
} from "@riprap/hanse";
import { findAssociatedTokenAddress } from "@riprap/pool";

import { type CrankDispatch, registerCrank } from "../../dispatch.js";
import type { ActionOf, CrankContext, CrankResult } from "../../types.js";

export async function execute(
  ctx: CrankContext,
  action: ActionOf<"claim_payout">,
): Promise<CrankResult> {
  const claim = await fetchClaim(ctx.rpc, action.claim);
  const mutual = await fetchMutual(ctx.rpc, action.mutual);
  const [depositor] = await findDepositorPda({
    pool: mutual.data.pool,
    owner: claim.data.member,
  });
  const treasury = await findAssociatedTokenAddress(mutual.data.depositMint, mutual.data.pool);
  const destination = await findAssociatedTokenAddress(mutual.data.depositMint, claim.data.member);

  const ix = await getClaimPayoutInstructionAsync({
    cranker: ctx.signer,
    claimant: claim.data.member,
    mutual: action.mutual,
    claim: action.claim,
    pool: mutual.data.pool,
    depositor,
    treasury,
    destination,
    depositMint: mutual.data.depositMint,
  });
  const signature = await ctx.sendIx(ix);
  ctx.log("claim_payout", action.claim, signature);
  return { signature };
}

/** Register this crank on the dispatch map. */
export function register(d: CrankDispatch): void {
  registerCrank(d, "claim_payout", execute);
}
