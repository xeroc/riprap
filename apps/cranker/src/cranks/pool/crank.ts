/**
 * pool_crank crank — the permissionless residual exit (CONTEXT.md, Liquidation
 * crank): pays one depositor its money-weighted share of the frozen treasury
 * base, exactly once, into the residual payee's canonical ATA (the owner's,
 * or the sponsor's beneficiary recorded at first deposit). The cranker pays
 * fees and receives nothing. Account assembly mirrors
 * `apps/cli/src/commands/pool/crank.ts`.
 */
import {
  fetchMaybeDepositorByOwner,
  fetchPool,
  findAssociatedTokenAddress,
  getCrankInstructionAsync,
} from "@riprap/pool";
import type { Address } from "@solana/kit";

import { type CrankDispatch, registerCrank } from "../../dispatch.js";
import type { ActionOf, CrankContext, CrankResult } from "../../types.js";

/** Pubkey::default() on-chain — an unset residual beneficiary. */
const NO_BENEFICIARY = "11111111111111111111111111111111" as Address;

export async function execute(
  ctx: CrankContext,
  action: ActionOf<"pool_crank">,
): Promise<CrankResult> {
  const pool = await fetchPool(ctx.rpc, action.pool);
  const treasury = await findAssociatedTokenAddress(pool.data.mint, action.pool);

  // Residual payee: the recorded sponsor beneficiary when set, else the owner.
  let payee = action.owner;
  const position = await fetchMaybeDepositorByOwner(ctx.rpc, {
    pool: action.pool,
    owner: action.owner,
  });
  if (position.exists && position.data.residualBeneficiary !== NO_BENEFICIARY) {
    payee = position.data.residualBeneficiary;
  }
  const destination = await findAssociatedTokenAddress(pool.data.mint, payee);

  const ix = await getCrankInstructionAsync({
    pool: action.pool,
    cranker: ctx.signer,
    owner: action.owner,
    destination,
    treasury,
  });
  const signature = await ctx.sendIx(ix);
  ctx.log("pool_crank", action.owner, signature);
  return { signature };
}

/** Register this crank on the dispatch map. */
export function register(d: CrankDispatch): void {
  registerCrank(d, "pool_crank", execute);
}
