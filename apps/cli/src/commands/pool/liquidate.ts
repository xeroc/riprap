/**
 * `riprap pool:liquidate` — the second door: terminal close of an open
 * pool by its ownership authority. Freezes the treasury balance as the
 * crank base; depositors then pull their money-weighted shares via
 * pool:crank.
 */
import { Flags } from "@oclif/core";
import { findAssociatedTokenAddress, getLiquidateInstruction } from "@riprap/pool";
import type { Address } from "@solana/kit";
import { ChainCommand, chainFlags } from "../../lib/base-command";
import { resolvePoolMint } from "../../lib/pool-resolve";

export default class PoolLiquidate extends ChainCommand {
  static summary = "Liquidate the pool (ownership authority signs)";

  static description =
    "Terminal: snapshots the remaining treasury balance as the crank base and " +
    "closes the pool to deposits and spending. The loaded wallet must be the " +
    "pool's ownership authority. Depositors exit via pool:crank.";

  static examples = ["<%= config.bin %> pool:liquidate --pool 9xQe…"];

  static flags = {
    ...chainFlags,
    pool: Flags.string({ description: "Pool account address", required: true }),
    mint: Flags.string({
      description: "Pool mint override — skips the pool-account fetch (offline --dry-run)",
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(PoolLiquidate);
    this.applyOutput(flags);

    const ctx = await this.loadChain(flags);
    const pool = flags.pool as Address;
    const mint = await resolvePoolMint(ctx.rpc, pool, flags.mint);
    const treasury = await findAssociatedTokenAddress(mint, pool);

    const instruction = getLiquidateInstruction({
      pool,
      ownershipAuthority: ctx.signer,
      treasury,
    });

    if (flags["dry-run"]) {
      this.emitDryRun(instruction);
      return;
    }
    const signature = await this.sendInstruction(ctx, instruction);
    this.emitSend(signature, { pool });
  }
}
