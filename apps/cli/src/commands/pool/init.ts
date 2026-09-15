/**
 * `riprap pool:init` — create a pool: PDA from the seed, treasury ATA,
 * three stake rates, three track authorities. All inputs explicit; the
 * loaded wallet sponsors rent and fees (paying implies no authority).
 */
import { Flags } from "@oclif/core";
import { findPoolPda, getInitInstructionAsync } from "@riprap/pool";
import type { Address } from "@solana/kit";

import { ChainCommand, chainFlags } from "../../lib/base-command";
import { toBigInt } from "../../lib/pool-args";

export default class PoolInit extends ChainCommand {
  static summary = "Create a pool (seed, treasury ATA, rates, track authorities)";

  static description =
    "Initializes a three-track mutual pool: pool PDA from --seed, treasury as " +
    "the pool's own ATA of --mint, stake rates per track (zero closes a " +
    "track), and one authority per track. The wallet pays rent + fees only.";

  static examples = [
    "<%= config.bin %> pool:init --seed 7 --mint 9xQe… --ownership-rate 1 --rights-rate 2 --yield-rate 0 --ownership-authority 9xQe… --rights-authority Token… --yield-authority ATok…",
  ];

  static flags = {
    ...chainFlags,
    seed: Flags.string({ description: "PDA seed for the pool account (u64)", required: true }),
    mint: Flags.string({ description: "The one token this pool accepts", required: true }),
    "ownership-rate": Flags.string({
      description: "Stake minted per unit deposited into the ownership track (0 = closed)",
      required: true,
    }),
    "rights-rate": Flags.string({
      description: "Stake minted per unit deposited into the rights track (0 = closed)",
      required: true,
    }),
    "yield-rate": Flags.string({
      description: "Stake minted per unit deposited into the yield track (0 = closed)",
      required: true,
    }),
    "ownership-authority": Flags.string({
      description: "Controller of the ownership track's powers",
      required: true,
    }),
    "rights-authority": Flags.string({
      description: "Controller of the rights track's powers",
      required: true,
    }),
    "yield-authority": Flags.string({
      description: "Controller of the yield track's powers",
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(PoolInit);
    this.applyOutput(flags);

    const ctx = await this.loadChain(flags);
    const seed = toBigInt("seed", flags.seed, 64);
    const [pool] = await findPoolPda({ seed });

    const instruction = await getInitInstructionAsync({
      rentPayer: ctx.signer,
      mint: flags.mint as Address,
      pool,
      seed,
      ownershipRate: toBigInt("ownership-rate", flags["ownership-rate"], 128),
      rightsRate: toBigInt("rights-rate", flags["rights-rate"], 128),
      yieldRate: toBigInt("yield-rate", flags["yield-rate"], 128),
      ownershipAuthority: flags["ownership-authority"] as Address,
      rightsAuthority: flags["rights-authority"] as Address,
      yieldAuthority: flags["yield-authority"] as Address,
    });

    if (flags["dry-run"]) {
      this.emitDryRun(instruction);
      return;
    }
    const signature = await this.sendInstruction(ctx, instruction);
    this.emitSend(signature, { pool });
  }
}
