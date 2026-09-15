/**
 * `riprap hanse:join` — buy cover: the wallet joins the mutual at a tier,
 * paying the contribution into the pool treasury (rights stake minted 1:1).
 * Member-signed; the member sponsors its own depositor rent (v1, bean
 * riprap-gneb). The pool + deposit mint are read from the mutual account
 * unless overridden (offline --dry-run).
 */
import { Flags } from "@oclif/core";
import {
  fetchMutual,
  findDepositorPda,
  findJoinMemberAccountPda,
  getJoinInstructionAsync,
} from "@riprap/hanse";
import type { Address } from "@solana/kit";

import { ChainCommand, chainFlags } from "../../lib/base-command";
import { TIER_OPTIONS, tierIndexFromName } from "../../lib/hanse-args";
import { findAssociatedTokenAddress } from "../../lib/token";

export default class HanseJoin extends ChainCommand {
  static summary = "Join a mutual at a cover tier (wallet = member)";

  static description =
    "Creates the member account [member, mutual, wallet], the pool depositor " +
    "position [depositor, pool, wallet], and transfers the tier's " +
    "contribution into the treasury (rights stake minted 1:1). Tier index " +
    "mapping: basic = 0, standard = 1, premium = 2 (Mutual.tiers order).";

  static examples = ["<%= config.bin %> hanse:join --mutual 9xQe… --tier standard"];

  static flags = {
    ...chainFlags,
    mutual: Flags.string({ description: "Mutual account address", required: true }),
    tier: Flags.string({
      description: "Cover tier (basic = 0, standard = 1, premium = 2)",
      options: [...TIER_OPTIONS],
      required: true,
    }),
    pool: Flags.string({
      description: "Pool override — skips the mutual fetch (offline --dry-run)",
    }),
    "deposit-mint": Flags.string({
      description: "Deposit mint override — skips the mutual fetch (offline --dry-run)",
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(HanseJoin);
    this.applyOutput(flags);

    const ctx = await this.loadChain(flags);
    const mutual = flags.mutual as Address;
    const tier = tierIndexFromName(flags.tier);

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

    const [memberAccount] = await findJoinMemberAccountPda({
      mutual,
      member: ctx.signer.address,
    });
    const [depositor] = await findDepositorPda({ pool, owner: ctx.signer.address });
    const ownerAta = await findAssociatedTokenAddress(depositMint, ctx.signer.address);
    const treasury = await findAssociatedTokenAddress(depositMint, pool);

    const instruction = await getJoinInstructionAsync({
      member: ctx.signer,
      memberAccount,
      mutual,
      pool,
      depositor,
      ownerAta,
      rentPayer: ctx.signer,
      treasury,
      depositMint,
      tier,
    });

    if (flags["dry-run"]) {
      this.emitDryRun(instruction);
      return;
    }
    const signature = await this.sendInstruction(ctx, instruction);
    this.emitSend(signature, { mutual, memberAccount, tier: flags.tier });
  }
}
