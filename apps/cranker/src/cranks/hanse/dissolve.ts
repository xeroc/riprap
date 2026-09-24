/**
 * dissolve crank — permissionless terminal crank (EVENT-MUTUAL §7): once the
 * pull window is over, liquidates the pool from the mutual's ownership
 * authority PDA (door two), snapshotting the treasury as the money-weighted
 * crank base. Members then exit via the pool crank directly.
 */
import { fetchMutual, getDissolveInstructionAsync } from "@riprap/hanse";
import { findAssociatedTokenAddress } from "@riprap/pool";

import { type CrankDispatch, registerCrank } from "../../dispatch.js";
import type { ActionOf, CrankContext, CrankResult } from "../../types.js";

export async function execute(
  ctx: CrankContext,
  action: ActionOf<"dissolve">,
): Promise<CrankResult> {
  const mutual = await fetchMutual(ctx.rpc, action.mutual);
  const treasury = await findAssociatedTokenAddress(mutual.data.depositMint, mutual.data.pool);

  const ix = await getDissolveInstructionAsync({
    cranker: ctx.signer,
    mutual: action.mutual,
    pool: mutual.data.pool,
    treasury,
  });
  const signature = await ctx.sendIx(ix);
  ctx.log("dissolve", action.mutual, signature);
  return { signature };
}

/** Register this crank on the dispatch map. */
export function register(d: CrankDispatch): void {
  registerCrank(d, "dissolve", execute);
}
