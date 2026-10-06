/**
 * `riprap hanse:member` — read-only member dump: tier with the contribution
 * and max payout resolved from Mutual.tiers, plus cap consumed (the filing
 * limiter — concurrent claims share the cumulative tier cap).
 */
import { Flags } from "@oclif/core";
import { fetchMemberByOwner, fetchMutual } from "@riprap/hanse";
import type { Address, Commitment, Rpc, SolanaRpcApi } from "@solana/kit";

import { ChainCommand, chainFlags } from "../../lib/base-command";
import { groupBigInt, truncateAddress } from "../../lib/format";

export interface MemberView {
  member: Address;
  tier: number;
  contribution: bigint;
  maxPayout: bigint;
  capUsed: bigint;
}

export async function buildMemberView(
  rpc: Rpc<SolanaRpcApi>,
  input: { mutual: Address; member: Address },
  _commitment: Commitment,
): Promise<MemberView> {
  const [{ data: mutual }, { data: account }] = await Promise.all([
    fetchMutual(rpc, input.mutual),
    fetchMemberByOwner(rpc, input),
  ]);
  const tier = mutual.tiers[account.tier];
  if (tier === undefined)
    throw new Error(`Member tier index ${account.tier} out of range (Mutual.tiers).`);
  return {
    member: account.member,
    tier: account.tier,
    contribution: tier.contribution,
    maxPayout: tier.maxPayout,
    capUsed: account.capUsed,
  };
}

export default class HanseMember extends ChainCommand {
  static summary = "Member position dump (tier + resolved cover + cap used)";

  static description =
    "Reads one member position [member, mutual, --member|wallet]: the tier " +
    "index with its contribution and max payout resolved from the mutual's " +
    "tier table, and the cumulative tier cap consumed — the only filing " +
    "limiter (multiple claims run concurrently until the cap is reached).";

  static examples = [
    "<%= config.bin %> hanse:member --mutual 9xQe…",
    "<%= config.bin %> hanse:member --mutual 9xQe… --member ATok…",
  ];

  static flags = {
    ...chainFlags,
    mutual: Flags.string({ description: "Mutual account address", required: true }),
    member: Flags.string({
      description: "Member address (default: the loaded wallet)",
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(HanseMember);
    this.applyOutput(flags);

    const ctx = await this.loadChain(flags);
    const view = await buildMemberView(
      ctx.rpc as Rpc<SolanaRpcApi>,
      { mutual: flags.mutual as Address, member: (flags.member ?? ctx.signer.address) as Address },
      ctx.commitment,
    );

    this.emitRead(view, {
      primary: flags.member,
      human: [
        `member       : ${truncateAddress(view.member)}`,
        `tier         : ${view.tier} (${view.tier === 0 ? "Basic" : view.tier === 1 ? "Standard" : view.tier === 2 ? "Premium" : "???"})`,
        `contribution : ${groupBigInt(view.contribution)}`,
        `max payout   : ${groupBigInt(view.maxPayout)}`,
        `cap used     : ${groupBigInt(view.capUsed)} of ${groupBigInt(view.maxPayout)} (cumulative tier cap — concurrent claims share it)`,
      ],
    });
  }
}
