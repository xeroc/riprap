/**
 * settle_claim crank — permissionless (EVENT-MUTUAL §7): books the claim's
 * verdict from the accord Dispute (Approved/Denied) or forwards the liveness
 * refund (Failed). The cranker pays fees and gains nothing. Account assembly
 * mirrors `apps/cli/src/commands/hanse/settle-claim.ts` (buildSettleClaim).
 */
import {
  fetchClaim,
  fetchMutual,
  findFeeFloatPda,
  findMemberAccountPda,
  getSettleClaimInstructionAsync,
} from "@riprap/hanse";
import { findAssociatedTokenAddress } from "@riprap/pool";

import { type CrankDispatch, registerCrank } from "../../dispatch.js";
import type { ActionOf, CrankContext, CrankResult } from "../../types.js";

export async function execute(
  ctx: CrankContext,
  action: ActionOf<"settle_claim">,
): Promise<CrankResult> {
  const claim = await fetchClaim(ctx.rpc, action.claim);
  const mutual = await fetchMutual(ctx.rpc, action.mutual);
  const [memberAccount] = await findMemberAccountPda({
    mutual: action.mutual,
    claimant: claim.data.member,
  });
  const claimantAta = await findAssociatedTokenAddress(mutual.data.feeMint, claim.data.member);
  const [feeFloat] = await findFeeFloatPda({
    mutual: action.mutual,
    feeMint: mutual.data.feeMint,
  });

  const ix = await getSettleClaimInstructionAsync({
    cranker: ctx.signer,
    mutual: action.mutual,
    claim: action.claim,
    memberAccount,
    dispute: claim.data.dispute,
    feeFloat,
    claimantAta,
    feeMint: mutual.data.feeMint,
  });
  const signature = await ctx.sendIx(ix);
  ctx.log("settle_claim", action.claim, signature);
  return { signature };
}

/** Register this crank on the dispatch map. */
export function register(d: CrankDispatch): void {
  registerCrank(d, "settle_claim", execute);
}
