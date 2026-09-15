/**
 * `riprap hanse:claim-payout` — THE multi-signer exception: the claimant
 * (loaded wallet) pulls an approved claim, and the mutual's authority
 * co-signs the Breakpoint pass gate (§2.10 / §12). Default --co-signer is
 * the loaded wallet itself (self-demo); production passes the admin key.
 * Atomic: spend + burn in one transaction, idempotent.
 */
import { Flags } from "@oclif/core";
import {
  fetchClaim,
  fetchMutual,
  findDepositorPda,
  getClaimPayoutInstructionAsync,
} from "@riprap/hanse";
import type { Address, Instruction, KeyPairSigner } from "@solana/kit";

import { ChainCommand, chainFlags } from "../../lib/base-command";
import { findAssociatedTokenAddress } from "../../lib/token";
import { loadKeypair } from "../../lib/wallet";

/**
 * Pure instruction assembly from decoded accounts — exported for tests
 * (two-signer set assembly without rpc).
 */
export async function buildClaimPayout(input: {
  claim: { address: Address; member: Address };
  mutual: { address: Address; pool: Address; depositMint: Address };
  claimant: KeyPairSigner;
  /** The mutual authority's pass-gate co-signature (§2.10). */
  authority: KeyPairSigner;
}): Promise<Instruction> {
  const { claim, mutual, claimant, authority } = input;
  const [depositor] = await findDepositorPda({ pool: mutual.pool, owner: claim.member });
  const treasury = await findAssociatedTokenAddress(mutual.depositMint, mutual.pool);
  const destination = await findAssociatedTokenAddress(mutual.depositMint, claimant.address);

  return await getClaimPayoutInstructionAsync({
    claimant,
    authority,
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
  static summary = "Pull an approved claim (claimant + authority co-sign)";

  static description =
    "The claimant pull: pays claim_amount × frozen ratio into the " +
    "claimant's deposit-mint ATA and burns the matching rights stake — " +
    "atomic and idempotent. Two signatures: the loaded wallet signs as the " +
    "claimant, and the mutual's authority co-signs the event-pass gate " +
    "(spec §2.10). --co-signer defaults to the loaded wallet (self-demo); " +
    "production uses the admin keypair path.";

  static examples = [
    "<%= config.bin %> hanse:claim-payout --claim 9xQe…",
    "<%= config.bin %> hanse:claim-payout --claim 9xQe… --co-signer /path/admin.json",
  ];

  static flags = {
    ...chainFlags,
    claim: Flags.string({ description: "Claim account address", required: true }),
    "co-signer": Flags.string({
      description:
        "Mutual authority keypair path for the pass-gate co-signature " +
        "(default: the loaded wallet — self-demo only; production uses the admin key)",
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(HanseClaimPayout);
    this.applyOutput(flags);

    const ctx = await this.loadChain(flags);
    const claimAccount = await fetchClaim(ctx.rpc, flags.claim as Address);
    const mutualAccount = await fetchMutual(ctx.rpc, claimAccount.data.mutual);
    const coSigner = flags["co-signer"] ? await loadKeypair(flags["co-signer"]) : ctx.signer;

    const instruction = await buildClaimPayout({
      claim: { address: claimAccount.address, member: claimAccount.data.member },
      mutual: {
        address: mutualAccount.address,
        pool: mutualAccount.data.pool,
        depositMint: mutualAccount.data.depositMint,
      },
      claimant: ctx.signer,
      authority: coSigner,
    });

    if (flags["dry-run"]) {
      this.emitDryRun(instruction);
      return;
    }
    const signature = await this.sendInstruction(ctx, instruction);
    this.emitSend(signature, {
      claim: flags.claim,
      mutual: claimAccount.data.mutual,
      claimant: ctx.signer.address,
      coSigner: coSigner.address,
    });
  }
}
