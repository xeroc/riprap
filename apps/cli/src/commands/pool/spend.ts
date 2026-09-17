/**
 * `riprap pool:spend` — adjudicated spending door: move money out of the
 * treasury to any token account of the pool's token. The wallet must be
 * the pool's rights authority. Spend does not mutate pool state; the
 * treasury balance is the record.
 */
import { Flags } from "@oclif/core";
import { findAssociatedTokenAddress, getSpendInstruction } from "@riprap/pool";
import type { Address } from "@solana/kit";
import { ChainCommand, chainFlags } from "../../lib/base-command";
import { toBigInt } from "../../lib/pool-args";
import { resolvePoolMint } from "../../lib/pool-resolve";

export default class PoolSpend extends ChainCommand {
  static summary = "Spend from the treasury (rights authority signs)";

  static description =
    "Transfers --amount of the pool's token from the treasury to " +
    "--destination. The loaded wallet must be the pool's rights authority. " +
    "This is one of the treasury's exactly two exits; the other is " +
    "liquidation + crank.";

  static examples = ["<%= config.bin %> pool:spend --pool 9xQe… --destination ATAk… --amount 500"];

  static flags = {
    ...chainFlags,
    pool: Flags.string({ description: "Pool account address", required: true }),
    destination: Flags.string({
      description: "Token account of the pool's token receiving the money",
      required: true,
    }),
    amount: Flags.string({ description: "Amount to spend (u64, raw units)", required: true }),
    mint: Flags.string({
      description: "Pool mint override — skips the pool-account fetch (offline --dry-run)",
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(PoolSpend);
    this.applyOutput(flags);

    const ctx = await this.loadChain(flags);
    const pool = flags.pool as Address;
    const mint = await resolvePoolMint(ctx.rpc, pool, flags.mint);
    const treasury = await findAssociatedTokenAddress(mint, pool);

    const instruction = getSpendInstruction({
      pool,
      rightsAuthority: ctx.signer,
      treasury,
      destination: flags.destination as Address,
      amount: toBigInt("amount", flags.amount, 64),
    });

    if (flags["dry-run"]) {
      this.emitDryRun(instruction);
      return;
    }
    const signature = await this.sendInstruction(ctx, instruction);
    this.emitSend(signature, { pool, destination: flags.destination });
  }
}
