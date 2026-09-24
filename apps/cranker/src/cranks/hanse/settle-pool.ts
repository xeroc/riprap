/**
 * settle_pool crank — permissionless (EVENT-MUTUAL §7): freezes the pro-rata
 * ratio every payout reads and opens the pull window. One-shot per mutual;
 * the reconciler only emits it once the window passed AND filed == resolved
 * (§2.5), so a ClaimsWindowOpen/ClaimsUnresolved revert means racing state —
 * the next cycle re-resolves.
 */
import { fetchMutual, getSettlePoolInstruction } from "@riprap/hanse";
import { findAssociatedTokenAddress } from "@riprap/pool";

import { type CrankDispatch, registerCrank } from "../../dispatch.js";
import type { ActionOf, CrankContext, CrankResult } from "../../types.js";

export async function execute(
  ctx: CrankContext,
  action: ActionOf<"settle_pool">,
): Promise<CrankResult> {
  const mutual = await fetchMutual(ctx.rpc, action.mutual);
  const treasury = await findAssociatedTokenAddress(mutual.data.depositMint, mutual.data.pool);
  // Amendment 2026-09-25 (audit H-2): the float is swept into the treasury
  // before the ratio freezes.
  const feeFloat = await findAssociatedTokenAddress(mutual.data.feeMint, action.mutual);

  const ix = await getSettlePoolInstruction({
    cranker: ctx.signer,
    mutual: action.mutual,
    treasury,
    feeFloat,
  });
  const signature = await ctx.sendIx(ix);
  ctx.log("settle_pool", action.mutual, signature);
  return { signature };
}

/** Register this crank on the dispatch map. */
export function register(d: CrankDispatch): void {
  registerCrank(d, "settle_pool", execute);
}
