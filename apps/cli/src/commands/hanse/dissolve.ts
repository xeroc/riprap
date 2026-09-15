/**
 * `riprap hanse:dissolve` — permissionless terminal crank: once the pull
 * window is over, liquidates the pool from the mutual's ownership authority
 * PDA (door two). Members exit the residual via the pool crank directly —
 * NO mutual wrapper.
 */
import { Flags } from "@oclif/core";
import { fetchMutual, getDissolveInstructionAsync } from "@riprap/hanse";
import type { Address } from "@solana/kit";

import { ChainCommand, chainFlags } from "../../lib/base-command";
import { findAssociatedTokenAddress } from "../../lib/token";

export default class HanseDissolve extends ChainCommand {
  static summary = "Liquidate the pool after the pull window (permissionless)";

  static description =
    "Terminal state: after pull_close_at, whatever remains in the treasury " +
    "is the residual. This cranks pool::liquidate through the mutual's " +
    "ownership authority PDA [mutual_own, mutual], snapshotting the balance " +
    "as the money-weighted crank base. Members then exit via pool:crank " +
    "directly. Anyone can run it.";

  static examples = ["<%= config.bin %> hanse:dissolve --mutual 9xQe…"];

  static flags = {
    ...chainFlags,
    mutual: Flags.string({ description: "Mutual account address", required: true }),
    pool: Flags.string({
      description: "Pool override — skips the mutual fetch (offline --dry-run)",
    }),
    "deposit-mint": Flags.string({
      description: "Deposit mint override — skips the mutual fetch (offline --dry-run)",
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(HanseDissolve);
    this.applyOutput(flags);

    const ctx = await this.loadChain(flags);
    const mutual = flags.mutual as Address;

    let pool: Address;
    let depositMint: Address;
    if (flags.pool && flags["deposit-mint"]) {
      pool = flags.pool as Address;
      depositMint = flags["deposit-mint"] as Address;
    } else {
      const account = await fetchMutual(ctx.rpc, mutual);
      pool = account.data.pool;
      depositMint = account.data.depositMint;
    }
    const treasury = await findAssociatedTokenAddress(depositMint, pool);

    const instruction = await getDissolveInstructionAsync({
      cranker: ctx.signer,
      mutual,
      pool,
      treasury,
    });

    if (flags["dry-run"]) {
      this.emitDryRun(instruction);
      return;
    }
    const signature = await this.sendInstruction(ctx, instruction);
    this.emitSend(signature, { mutual, pool });
  }
}
