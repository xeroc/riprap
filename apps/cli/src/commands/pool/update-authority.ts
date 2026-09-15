/**
 * `riprap pool:update-authority` — hand a track's powers to a new key or
 * program PDA. The loaded wallet must be the track's CURRENT authority.
 */
import { Flags } from "@oclif/core";
import { getUpdateAuthorityInstruction } from "@riprap/pool";
import type { Address } from "@solana/kit";

import { ChainCommand, chainFlags } from "../../lib/base-command";
import { TRACK_OPTIONS, trackFromName } from "../../lib/pool-args";

export default class PoolUpdateAuthority extends ChainCommand {
  static summary = "Replace a track's authority (current authority signs)";

  static description =
    "Sets the authority of --track to --new (any key or program PDA). The " +
    "loaded wallet must currently hold that track's authority; rotation " +
    "hands the power off irreversibly.";

  static examples = [
    "<%= config.bin %> pool:update-authority --pool 9xQe… --track rights --new 9xQe…",
  ];

  static flags = {
    ...chainFlags,
    pool: Flags.string({ description: "Pool account address", required: true }),
    track: Flags.string({
      description: "Track whose authority rotates",
      options: [...TRACK_OPTIONS],
      required: true,
    }),
    new: Flags.string({
      description: "New authority (pubkey or program PDA)",
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(PoolUpdateAuthority);
    this.applyOutput(flags);

    const ctx = await this.loadChain(flags);
    const instruction = getUpdateAuthorityInstruction({
      pool: flags.pool as Address,
      authority: ctx.signer,
      track: trackFromName(flags.track),
      new: flags.new as Address,
    });

    if (flags["dry-run"]) {
      this.emitDryRun(instruction);
      return;
    }
    const signature = await this.sendInstruction(ctx, instruction);
    this.emitSend(signature, { pool: flags.pool, track: flags.track, new: flags.new });
  }
}
