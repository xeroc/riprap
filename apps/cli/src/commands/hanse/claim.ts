/**
 * `riprap hanse:claim` — read-only claim dump: status, clamped amount, fee
 * paid, dispute link, member, filed/settled timestamps.
 */
import { Flags } from "@oclif/core";
import { type Claim, ClaimStatus, fetchClaim } from "@riprap/hanse";
import type { Address, Rpc, SolanaRpcApi } from "@solana/kit";

import { ChainCommand, chainFlags } from "../../lib/base-command";
import { groupBigInt, isoFromUnixSeconds, truncateAddress } from "../../lib/format";

export function claimStatusLabel(status: ClaimStatus): string {
  switch (status) {
    case ClaimStatus.Pending:
      return "Pending";
    case ClaimStatus.Approved:
      return "Approved";
    case ClaimStatus.Denied:
      return "Denied";
    case ClaimStatus.Failed:
      return "Failed";
    case ClaimStatus.Paid:
      return "Paid";
  }
}

export async function buildClaimView(
  rpc: Rpc<SolanaRpcApi>,
  claimAddress: Address,
): Promise<Claim> {
  const { data: claim } = await fetchClaim(rpc, claimAddress);
  return claim;
}

export default class HanseClaim extends ChainCommand {
  static summary = "Claim account dump (status, amount, fee, dispute)";

  static description =
    "Reads one claim: adjudication status (Pending → Approved/Denied/Failed " +
    "by settle-claim, Paid by claim-payout), the stored claim_amount " +
    "(min(requested, tier cap) at filing), the juror fee paid, the accord " +
    "Dispute link, the member, and the filed/settled timestamps.";

  static examples = ["<%= config.bin %> hanse:claim --claim 9xQe…"];

  static flags = {
    ...chainFlags,
    claim: Flags.string({ description: "Claim account address", required: true }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(HanseClaim);
    this.applyOutput(flags);

    const ctx = await this.loadChain(flags);
    const claim = await buildClaimView(ctx.rpc as Rpc<SolanaRpcApi>, flags.claim as Address);

    this.emitRead(claim, {
      primary: flags.claim,
      human: [
        `status     : ${claimStatusLabel(claim.status)}`,
        `member     : ${truncateAddress(claim.member)}`,
        `mutual     : ${truncateAddress(claim.mutual)}`,
        `amount     : ${groupBigInt(claim.claimAmount)}`,
        `fee paid   : ${groupBigInt(claim.feePaid)}`,
        `dispute    : ${truncateAddress(claim.dispute)}`,
        `filed at   : ${isoFromUnixSeconds(claim.filedAt)}`,
        `settled at : ${claim.settledAt === 0n ? "—" : isoFromUnixSeconds(claim.settledAt)}`,
      ],
    });
  }
}
