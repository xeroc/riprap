/**
 * `riprap pool:show` — read-only pool dump: decoded account, treasury
 * balance, and the payout base the crank would pay against (live balance
 * while open; frozen liquidation balance once liquidated).
 */
import { Flags } from "@oclif/core";
import { fetchPool, findAssociatedTokenAddress, type Pool, PoolState } from "@riprap/pool";
import type { Address, Commitment, Rpc, SolanaRpcApi } from "@solana/kit";
import { ChainCommand, chainFlags } from "../../lib/base-command";
import { groupBigInt, truncateAddress } from "../../lib/format";

export interface PoolView {
  pool: Pool;
  treasury: Address;
  treasuryBalance: bigint;
  /** What a crank payout is computed against (crank.rs pays the frozen base). */
  payoutBase: bigint;
  baseSource: "live" | "liquidation";
}

export async function buildPoolView(
  rpc: Rpc<SolanaRpcApi>,
  poolAddress: Address,
  commitment: Commitment,
): Promise<PoolView> {
  const { data: pool } = await fetchPool(rpc, poolAddress);
  const treasury = await findAssociatedTokenAddress(pool.mint, poolAddress);
  const { value } = await rpc.getTokenAccountBalance(treasury, { commitment }).send();
  const treasuryBalance = BigInt(value.amount);
  const liquidated = pool.state === PoolState.Liquidated;
  return {
    pool,
    treasury,
    treasuryBalance,
    payoutBase: liquidated ? pool.liquidationBalance : treasuryBalance,
    baseSource: liquidated ? "liquidation" : "live",
  };
}

export default class PoolShow extends ChainCommand {
  static summary = "Pool account dump + treasury balance + payout base";

  static description =
    "Reads the pool account, derives its treasury ATA, and shows the decoded " +
    "state (rates, authorities, totals) alongside the live treasury balance " +
    "and the base crank payouts are computed against.";

  static examples = ["<%= config.bin %> pool:show --pool 9xQe…"];

  static flags = {
    ...chainFlags,
    pool: Flags.string({ description: "Pool account address", required: true }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(PoolShow);
    this.applyOutput(flags);

    const ctx = await this.loadChain(flags);
    const view = await buildPoolView(
      ctx.rpc as Rpc<SolanaRpcApi>,
      flags.pool as Address,
      ctx.commitment,
    );

    this.emitRead(
      {
        ...view.pool,
        treasury: view.treasury,
        treasuryBalance: view.treasuryBalance,
        payoutBase: view.payoutBase,
        baseSource: view.baseSource,
      },
      {
        primary: flags.pool,
        human: [
          `state      : ${view.pool.state === PoolState.Liquidated ? "Liquidated" : "Open"}`,
          `mint       : ${truncateAddress(view.pool.mint)}`,
          `seed       : ${view.pool.seed}`,
          `rates      : ownership ${view.pool.ownershipRate} / rights ${view.pool.rightsRate} / yield ${view.pool.yieldRate}`,
          `authorities: ownership ${truncateAddress(view.pool.ownershipAuthority)} / rights ${truncateAddress(view.pool.rightsAuthority)} / yield ${truncateAddress(view.pool.yieldAuthority)}`,
          `totalAmount: ${groupBigInt(view.pool.totalAmount)}`,
          `treasury   : ${truncateAddress(view.treasury)} — ${groupBigInt(view.treasuryBalance)}`,
          `payoutBase : ${groupBigInt(view.payoutBase)} (${view.baseSource}${view.baseSource === "liquidation" ? ", frozen at liquidation" : ""})`,
        ],
      },
    );
  }
}
