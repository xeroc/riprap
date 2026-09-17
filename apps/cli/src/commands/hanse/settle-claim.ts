/**
 * `riprap hanse:settle-claim` — permissionless crank: reads the ruling
 * directly off the accord Dispute (no get_ruling CPI) and books the claim
 * Approved / Denied / Failed (Failed refunds the fee to the claimant).
 * The cranker pays fees and gains nothing.
 */
import { Flags } from "@oclif/core";
import {
  fetchClaim,
  fetchMutual,
  findFeeFloatPda,
  findMemberAccountPda,
  getSettleClaimInstructionAsync,
} from "@riprap/hanse";
import { findAssociatedTokenAddress } from "@riprap/pool";
import type { Address, Instruction, TransactionSigner } from "@solana/kit";
import { ChainCommand, chainFlags } from "../../lib/base-command";

/**
 * Pure instruction assembly from decoded accounts — exported for tests.
 * dispute = claim.dispute (canon settle_item pattern: the ruling is read
 * directly from the Dispute account).
 */
export async function buildSettleClaim(input: {
  mutual: { address: Address; feeMint: Address };
  claim: { address: Address; member: Address; dispute: Address };
  cranker: TransactionSigner;
}): Promise<Instruction> {
  const { mutual, claim } = input;
  const [memberAccount] = await findMemberAccountPda({
    mutual: mutual.address,
    claimant: claim.member,
  });
  const claimantAta = await findAssociatedTokenAddress(mutual.feeMint, claim.member);
  const [feeFloat] = await findFeeFloatPda({ mutual: mutual.address, feeMint: mutual.feeMint });
  return await getSettleClaimInstructionAsync({
    cranker: input.cranker,
    mutual: mutual.address,
    claim: claim.address,
    memberAccount,
    dispute: claim.dispute,
    feeFloat,
    claimantAta,
    feeMint: mutual.feeMint,
  });
}

export default class HanseSettleClaim extends ChainCommand {
  static summary = "Settle one claim from its Dispute ruling (permissionless)";

  static description =
    "Books the claim's verdict from the accord Dispute: Approved adds the " +
    "claim amount to the mutual's obligations (fee refunded through the " +
    "settlement ratio), Denied leaves the fee with the jurors, Failed " +
    "forwards the refunded fee to the claimant. Anyone can crank.";

  static examples = ["<%= config.bin %> hanse:settle-claim --claim 9xQe…"];

  static flags = {
    ...chainFlags,
    claim: Flags.string({ description: "Claim account address", required: true }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(HanseSettleClaim);
    this.applyOutput(flags);

    const ctx = await this.loadChain(flags);
    const claimAccount = await fetchClaim(ctx.rpc, flags.claim as Address);
    const mutualAccount = await fetchMutual(ctx.rpc, claimAccount.data.mutual);

    const instruction = await buildSettleClaim({
      mutual: { address: mutualAccount.address, feeMint: mutualAccount.data.feeMint },
      claim: {
        address: claimAccount.address,
        member: claimAccount.data.member,
        dispute: claimAccount.data.dispute,
      },
      cranker: ctx.signer,
    });

    if (flags["dry-run"]) {
      this.emitDryRun(instruction);
      return;
    }
    const signature = await this.sendInstruction(ctx, instruction);
    this.emitSend(signature, { claim: flags.claim, mutual: claimAccount.data.mutual });
  }
}
