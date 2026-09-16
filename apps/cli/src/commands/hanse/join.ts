/**
 * `riprap hanse:join` — buy cover: the wallet joins the mutual at a tier,
 * paying the contribution into the pool treasury (rights stake minted 1:1).
 * Member-signed (consent + claim key); the money may come from a sponsor:
 * `--sponsor <keypair>` pays the contribution from the sponsor's wallet and
 * takes the settlement leftover (the residual), while the member keeps every
 * claim right — payouts still land only in the member's ATA. The on-chain
 * rent_payer account funds the Member + depositor PDA rent; the CLI wires it
 * to the sponsor when present, else to this wallet.
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
import { loadKeypair } from "../../lib/wallet";

export default class HanseJoin extends ChainCommand {
  static summary = "Join a mutual at a cover tier (wallet = member)";

  static description =
    "Creates the member account [member, mutual, wallet], the pool depositor " +
    "position [depositor, pool, wallet], and transfers the tier's " +
    "contribution into the treasury (rights stake minted 1:1). Tier index " +
    "mapping: basic = 0, standard = 1, premium = 2 (Mutual.tiers order). " +
    "--sponsor <keypair> pays the cover from another wallet: the sponsor " +
    "receives the settlement residual (frozen at join, immutable); claim " +
    "payouts stay the member's alone.";

  static examples = [
    "<%= config.bin %> hanse:join --mutual 9xQe… --tier standard",
    "<%= config.bin %> hanse:join --mutual 9xQe… --tier standard --sponsor /path/sponsor.json",
  ];

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
    sponsor: Flags.string({
      description:
        "Cover sponsor keypair path — pays the contribution and receives the " +
        "settlement leftover; the member keeps all claim rights (optional)",
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(HanseJoin);
    this.applyOutput(flags);

    const ctx = await this.loadChain(flags);
    const mutual = flags.mutual as Address;
    const tier = tierIndexFromName(flags.tier);
    const sponsor = flags.sponsor ? await loadKeypair(flags.sponsor) : undefined;

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
    // Contribution source: the sponsor's ATA when sponsoring, else the member's.
    const ownerAta = await findAssociatedTokenAddress(
      depositMint,
      sponsor ? sponsor.address : ctx.signer.address,
    );
    const treasury = await findAssociatedTokenAddress(depositMint, pool);

    const instruction = await getJoinInstructionAsync({
      member: ctx.signer,
      funder: sponsor,
      memberAccount,
      mutual,
      pool,
      depositor,
      ownerAta,
      rentPayer: sponsor ?? ctx.signer,
      treasury,
      depositMint,
      tier,
    });

    if (flags["dry-run"]) {
      this.emitDryRun(instruction);
      return;
    }
    const signature = await this.sendInstruction(ctx, instruction);
    this.emitSend(signature, {
      mutual,
      memberAccount,
      tier: flags.tier,
      ...(sponsor ? { sponsor: sponsor.address } : {}),
    });
  }
}
