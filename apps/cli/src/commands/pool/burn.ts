/**
 * `riprap pool:burn` — a depositor's exit from the residual: burns track
 * stake so the money-weighted crank no longer counts it. The loaded wallet
 * must be the given track's authority.
 */
import { Flags } from "@oclif/core";
import { getBurnInstructionAsync } from "@riprap/pool";
import type { Address } from "@solana/kit";

import { ChainCommand, chainFlags } from "../../lib/base-command";
import { TRACK_OPTIONS, toBigInt, trackFromName } from "../../lib/pool-args";

export default class PoolBurn extends ChainCommand {
  static summary = "Burn a depositor's track stake (track authority signs)";

  static description =
    "Burns --amount of --owner's stake in --track, reducing its claim on the " +
    "remaining treasury. The loaded wallet must be the pool's authority for " +
    "that track. Paid claimants exit the residual through this instruction.";

  static examples = [
    "<%= config.bin %> pool:burn --pool 9xQe… --owner 9xQe… --track yield --amount 100",
  ];

  static flags = {
    ...chainFlags,
    pool: Flags.string({ description: "Pool account address", required: true }),
    owner: Flags.string({
      description: "Owner of the depositor position whose stake burns",
      required: true,
    }),
    track: Flags.string({
      description: "Track whose stake burns",
      options: [...TRACK_OPTIONS],
      required: true,
    }),
    amount: Flags.string({ description: "Stake to burn (u64, raw units)", required: true }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(PoolBurn);
    this.applyOutput(flags);

    const ctx = await this.loadChain(flags);
    const instruction = await getBurnInstructionAsync({
      pool: flags.pool as Address,
      authority: ctx.signer,
      owner: flags.owner as Address,
      track: trackFromName(flags.track),
      amount: toBigInt("amount", flags.amount, 64),
    });

    if (flags["dry-run"]) {
      this.emitDryRun(instruction);
      return;
    }
    const signature = await this.sendInstruction(ctx, instruction);
    this.emitSend(signature, { pool: flags.pool, owner: flags.owner, track: flags.track });
  }
}
