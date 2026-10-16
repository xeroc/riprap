/**
 * `riprap hanse:claim-payout` — the payout crank: pays an approved claim
 * into the claimant's canonical ATA (they never sign) and burns the
 * matching rights stake — atomic and idempotent. Permissionless (the pilot
 * authority gate retired 2026-10-15, ADR-0005 amendment): any loaded
 * keypair cranks.
 */
import { Flags } from "@oclif/core";
import {
  fetchClaim,
  fetchMutual,
  findDepositorPda,
  getClaimPayoutInstructionAsync,
} from "@riprap/hanse";
import { findAssociatedTokenAddress } from "@riprap/pool";
import type { Address, Instruction, KeyPairSigner } from "@solana/kit";
import { ChainCommand, chainFlags } from "../../lib/base-command";

/**
 * Pure instruction assembly from decoded accounts — exported for tests
 * (single-signer crank assembly without rpc).
 */
export async function buildClaimPayout(input: {
  claim: { address: Address; member: Address };
  mutual: { address: Address; pool: Address; depositMint: Address };
  /** The crank initiator — any key (permissionless; pilot gate retired 2026-10-15). */
  cranker: KeyPairSigner;
}): Promise<Instruction> {
  const { claim, mutual, cranker } = input;
  const [depositor] = await findDepositorPda({ pool: mutual.pool, owner: claim.member });
  const treasury = await findAssociatedTokenAddress(mutual.depositMint, mutual.pool);
  const destination = await findAssociatedTokenAddress(mutual.depositMint, claim.member);

  return await getClaimPayoutInstructionAsync({
    cranker,
    claimant: claim.member,
    mutual: mutual.address,
    claim: claim.address,
    pool: mutual.pool,
    depositor,
    treasury,
    destination,
    depositMint: mutual.depositMint,
  });
}

export default class HanseClaimPayout extends ChainCommand {
  static summary = "Crank an approved claim's payout to the claimant (permissionless)";

  static description =
    "The payout crank: pays claim_amount × frozen ratio into the claimant's " +
    "deposit-mint ATA and burns the matching rights stake — atomic and " +
    "idempotent. The claimant never signs: whoever turns the crank, the " +
    "money lands in the claimant's ATA. Permissionless — the pilot " +
    "authority gate retired 2026-10-15 (ADR-0005 amendment).";

  static examples = ["<%= config.bin %> hanse:claim-payout --claim 9xQe…"];

  static flags = {
    ...chainFlags,
    claim: Flags.string({ description: "Claim account address", required: true }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(HanseClaimPayout);
    this.applyOutput(flags);

    const ctx = await this.loadChain(flags);
    const claimAccount = await fetchClaim(ctx.rpc, flags.claim as Address);
    const mutualAccount = await fetchMutual(ctx.rpc, claimAccount.data.mutual);

    const instruction = await buildClaimPayout({
      claim: { address: claimAccount.address, member: claimAccount.data.member },
      mutual: {
        address: mutualAccount.address,
        pool: mutualAccount.data.pool,
        depositMint: mutualAccount.data.depositMint,
      },
      cranker: ctx.signer,
    });

    if (flags["dry-run"]) {
      this.emitDryRun(instruction);
      return;
    }
    const signature = await this.sendInstruction(ctx, instruction);
    this.emitSend(signature, {
      claim: flags.claim,
      mutual: claimAccount.data.mutual,
      claimant: claimAccount.data.member,
      cranker: ctx.signer.address,
    });
  }
}
