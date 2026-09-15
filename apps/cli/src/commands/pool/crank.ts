/**
 * `riprap pool:crank` — permissionless liquidation crank: pays one
 * depositor its money-weighted share of the frozen treasury base, exactly
 * once. The cranker pays transaction fees and receives nothing; the
 * depositor's owner is paid at its canonical ATA.
 */
import { Flags } from "@oclif/core";
import { getCrankInstructionAsync } from "@riprap/pool";
import type { Address } from "@solana/kit";

import { ChainCommand, chainFlags } from "../../lib/base-command";
import { resolvePoolMint } from "../../lib/pool-resolve";
import { findAssociatedTokenAddress } from "../../lib/token";

export default class PoolCrank extends ChainCommand {
  static summary = "Pay one depositor its money-weighted share (permissionless)";

  static description =
    "Pays --owner their floored money-weighted share (depositor total × " +
    "frozen liquidation balance ÷ pool total) into the owner's canonical ATA " +
    "of the pool's token, then marks the position settled. Anyone can crank; " +
    "the cranker only pays fees — cranking someone else's position pays that " +
    "someone. Requires the pool to be liquidated.";

  static examples = ["<%= config.bin %> pool:crank --pool 9xQe… --owner 9xQe…"];

  static flags = {
    ...chainFlags,
    pool: Flags.string({ description: "Pool account address", required: true }),
    owner: Flags.string({
      description: "Owner of the depositor position to pay",
      required: true,
    }),
    mint: Flags.string({
      description: "Pool mint override — skips the pool-account fetch (offline --dry-run)",
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(PoolCrank);
    this.applyOutput(flags);

    const ctx = await this.loadChain(flags);
    const pool = flags.pool as Address;
    const owner = flags.owner as Address;
    const mint = await resolvePoolMint(ctx.rpc, pool, flags.mint);
    const treasury = await findAssociatedTokenAddress(mint, pool);
    const destination = await findAssociatedTokenAddress(mint, owner);

    const instruction = await getCrankInstructionAsync({
      pool,
      cranker: ctx.signer,
      owner,
      destination,
      treasury,
    });

    if (flags["dry-run"]) {
      this.emitDryRun(instruction);
      return;
    }
    const signature = await this.sendInstruction(ctx, instruction);
    this.emitSend(signature, { pool, owner });
  }
}
