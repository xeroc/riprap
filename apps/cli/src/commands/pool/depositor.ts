/**
 * `riprap pool:depositor` — read-only depositor position: decoded account,
 * frozen per-track stakes, live treasury balance, and the money-weighted
 * payout a crank would pay right now (floored, crank.rs formula).
 */
import { Flags } from "@oclif/core";
import {
  type Depositor,
  fetchMaybeDepositorByOwner,
  fetchPool,
  findDepositorPda,
  type Pool,
  PoolState,
} from "@riprap/pool";
import type { Address, Commitment, Rpc, SolanaRpcApi } from "@solana/kit";

import { ChainCommand, chainFlags } from "../../lib/base-command";
import { groupBigInt, truncateAddress } from "../../lib/format";
import { moneyWeightedPayout } from "../../lib/pool-math";
import { findAssociatedTokenAddress } from "../../lib/token";

export interface DepositorView {
  pool: Pool;
  depositor: Depositor;
  depositorAddress: Address;
  treasury: Address;
  treasuryBalance: bigint;
  payoutBase: bigint;
  baseSource: "live" | "liquidation";
  /** Floored money-weighted share a crank would pay this position now. */
  previewPayout: bigint;
}

export async function buildDepositorView(
  rpc: Rpc<SolanaRpcApi>,
  poolAddress: Address,
  owner: Address,
  commitment: Commitment,
): Promise<DepositorView> {
  const { data: pool } = await fetchPool(rpc, poolAddress);
  const maybe = await fetchMaybeDepositorByOwner(rpc, { pool: poolAddress, owner });
  if (!maybe.exists) {
    throw new Error(`No depositor position for ${owner} in pool ${poolAddress}.`);
  }
  const depositor = maybe.data;

  const [depositorAddress] = await findDepositorPda({ pool: poolAddress, owner });
  const treasury = await findAssociatedTokenAddress(pool.mint, poolAddress);
  const { value } = await rpc.getTokenAccountBalance(treasury, { commitment }).send();
  const treasuryBalance = BigInt(value.amount);
  const liquidated = pool.state === PoolState.Liquidated;
  const payoutBase = liquidated ? pool.liquidationBalance : treasuryBalance;

  return {
    pool,
    depositor,
    depositorAddress,
    treasury,
    treasuryBalance,
    payoutBase,
    baseSource: liquidated ? "liquidation" : "live",
    previewPayout: moneyWeightedPayout(payoutBase, depositor.totalAmount, pool.totalAmount),
  };
}

export default class PoolDepositor extends ChainCommand {
  static summary = "Depositor position + money-weighted payout preview";

  static description =
    "Reads one depositor position (owner + pool), its frozen per-track " +
    "stakes, and previews the floored money-weighted payout a crank would " +
    "pay right now: depositor total × payout base ÷ pool total. The base is " +
    "the live treasury balance while open, the frozen liquidation balance " +
    "after liquidation.";

  static examples = ["<%= config.bin %> pool:depositor --pool 9xQe… --owner 9xQe…"];

  static flags = {
    ...chainFlags,
    pool: Flags.string({ description: "Pool account address", required: true }),
    owner: Flags.string({ description: "Owner of the depositor position", required: true }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(PoolDepositor);
    this.applyOutput(flags);

    const ctx = await this.loadChain(flags);
    const view = await buildDepositorView(
      ctx.rpc as Rpc<SolanaRpcApi>,
      flags.pool as Address,
      flags.owner as Address,
      ctx.commitment,
    );

    this.emitRead(
      {
        pool: flags.pool,
        owner: view.depositor.owner,
        depositorAddress: view.depositorAddress,
        totalAmount: view.depositor.totalAmount,
        ownershipStake: view.depositor.ownershipStake,
        rightsStake: view.depositor.rightsStake,
        yieldStake: view.depositor.yieldStake,
        settled: view.depositor.settled,
        treasury: view.treasury,
        treasuryBalance: view.treasuryBalance,
        payoutBase: view.payoutBase,
        baseSource: view.baseSource,
        previewPayout: view.previewPayout,
      },
      {
        primary: view.depositorAddress,
        human: [
          `owner        : ${truncateAddress(view.depositor.owner)}`,
          `depositor    : ${truncateAddress(view.depositorAddress)}`,
          `totalAmount  : ${groupBigInt(view.depositor.totalAmount)} of pool ${groupBigInt(view.pool.totalAmount)}`,
          `stakes       : ownership ${groupBigInt(view.depositor.ownershipStake)} / rights ${groupBigInt(view.depositor.rightsStake)} / yield ${groupBigInt(view.depositor.yieldStake)}`,
          `settled      : ${view.depositor.settled}`,
          `treasury     : ${truncateAddress(view.treasury)} — ${groupBigInt(view.treasuryBalance)}`,
          `payoutBase   : ${groupBigInt(view.payoutBase)} (${view.baseSource})`,
          `previewPayout: ${groupBigInt(view.previewPayout)}`,
        ],
      },
    );
  }
}
