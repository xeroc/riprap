/**
 * settle_claim crank — permissionless (EVENT-MUTUAL §7): books the claim's
 * verdict from the accord Dispute (Approved/Denied/Failed — all bookkeeping;
 * the Failed fee rides the settlement ratio, amendment 2026-09-25). The
 * cranker pays fees and gains nothing. Account assembly mirrors
 * `apps/cli/src/commands/hanse/settle-claim.ts` (buildSettleClaim).
 */
import { fetchClaim, findMemberAccountPda, getSettleClaimInstruction } from "@riprap/hanse";

import { type CrankDispatch, registerCrank } from "../../dispatch.js";
import type { ActionOf, CrankContext, CrankResult } from "../../types.js";

export async function execute(
  ctx: CrankContext,
  action: ActionOf<"settle_claim">,
): Promise<CrankResult> {
  const claim = await fetchClaim(ctx.rpc, action.claim);
  const [memberAccount] = await findMemberAccountPda({
    mutual: action.mutual,
    claimant: claim.data.member,
  });

  const ix = getSettleClaimInstruction({
    cranker: ctx.signer,
    mutual: action.mutual,
    claim: action.claim,
    memberAccount,
    dispute: claim.data.dispute,
  });
  const signature = await ctx.sendIx(ix);
  ctx.log("settle_claim", action.claim, signature);
  return { signature };
}

/** Register this crank on the dispatch map. */
export function register(d: CrankDispatch): void {
  registerCrank(d, "settle_claim", execute);
}
