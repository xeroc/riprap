/**
 * `riprap hanse:settle-pool` — permissionless settlement crank: freezes the
 * pro-rata ratio (min(1e9, treasury / (obligations + fee_refunds))) and arms
 * the pull window (§2.5). Requires every filed claim to be resolved. The
 * frozen ratio + pull_close_at are printed after send.
 */
import { Flags } from "@oclif/core";
import { fetchMutual, getSettlePoolInstruction } from "@riprap/hanse";
import { findAssociatedTokenAddress } from "@riprap/pool";
import type { Address } from "@solana/kit";
import { ChainCommand, chainFlags } from "../../lib/base-command";
import { groupBigInt, isoFromUnixSeconds } from "../../lib/format";

export default class HanseSettlePool extends ChainCommand {
  static summary = "Freeze the settlement ratio + arm the pull window (permissionless)";

  static description =
    "Settles the mutual after claims close and every claim is resolved: " +
    "freezes ratio_1e9 = min(1e9, treasury ÷ (obligations + fee_refunds)) " +
    "and sets pull_close_at = now + pull_window. Approved payouts and fee " +
    "refunds are paid at this ratio; unpaid amounts revert to the residual " +
    "when the pull window closes. Anyone can crank.";

  static examples = ["<%= config.bin %> hanse:settle-pool --mutual 9xQe…"];

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
    const { flags } = await this.parse(HanseSettlePool);
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

    const instruction = await getSettlePoolInstruction({
      cranker: ctx.signer,
      mutual,
      treasury,
    });

    if (flags["dry-run"]) {
      this.emitDryRun(instruction);
      return;
    }
    const signature = await this.sendInstruction(ctx, instruction);

    // Read the frozen settlement back so the operator sees the ratio every
    // payout will use (§2.5).
    const settled = await fetchMutual(ctx.rpc, mutual);
    this.emitSend(signature, {
      mutual,
      ratio1e9: `${groupBigInt(settled.data.ratio1e9)} / 1_000_000_000`,
      pullCloseAt: `${settled.data.pullCloseAt} (${isoFromUnixSeconds(settled.data.pullCloseAt)})`,
    });
  }
}
