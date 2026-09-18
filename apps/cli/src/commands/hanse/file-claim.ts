/**
 * `riprap hanse:file-claim` — a member files a claim: transfers the juror
 * fee (min_jury_size × fee_per_juror, auto-derived from the subaccord) from
 * the member's own fee ATA and creates the accord Dispute via the mutual.
 * The fee is PRINTED before send. Requires RPC even for --dry-run (the claim
 * nonce and live jury economics are chain state).
 */
import { Flags } from "@oclif/core";
import {
  fetchMutual,
  findClaimPda,
  findDepositorPda,
  findFeeFloatPda,
  getFileClaimInstructionAsync,
} from "@riprap/hanse";
import { findAssociatedTokenAddress } from "@riprap/pool";
import type { Address, Instruction, KeyPairSigner } from "@solana/kit";
import { fetchSubaccord, findAccordStatePda, findDisputePda, type Subaccord } from "@useaccord/sdk";
import { ChainCommand, chainFlags } from "../../lib/base-command";
import { groupBigInt } from "../../lib/format";
import { hexToBytes32, juryFee } from "../../lib/hanse-args";
import { toBigInt } from "../../lib/pool-args";

/** The live fee inputs file-claim needs off the subaccord (§2.6). */
export interface FeeSource {
  minJurySize: number;
  feePerJuror: bigint;
}

/** Mutual fields file-claim derives everything from (decoded account shape). */
export interface FileClaimMutual {
  address: Address;
  claimNonce: bigint;
  pool: Address;
  subaccord: Address;
  depositMint: Address;
  feeMint: Address;
}

export interface FileClaimBuild {
  instruction: Instruction;
  fee: bigint;
  claim: Address;
  dispute: Address;
}

/**
 * Pure instruction assembly from decoded accounts — exported for tests
 * (no rpc; the command owns the fetches).
 */
export async function buildFileClaim(input: {
  mutual: FileClaimMutual;
  subaccord: FeeSource;
  claimant: KeyPairSigner;
  requested: bigint;
  evidenceHash: Uint8Array;
}): Promise<FileClaimBuild> {
  const { mutual, claimant } = input;
  const fee = juryFee(input.subaccord.minJurySize, input.subaccord.feePerJuror);
  const nonce = mutual.claimNonce;

  const [claim] = await findClaimPda({ mutual: mutual.address, nonce });
  const [depositor] = await findDepositorPda({ pool: mutual.pool, owner: claimant.address });
  const memberFeeAta = await findAssociatedTokenAddress(mutual.feeMint, claimant.address);
  const [feeFloat] = await findFeeFloatPda({ mutual: mutual.address, feeMint: mutual.feeMint });
  const treasury = await findAssociatedTokenAddress(mutual.depositMint, mutual.pool);
  const [dispute] = await findDisputePda({ filer: mutual.address, nonce });
  const feeVault = await findAssociatedTokenAddress(mutual.feeMint, mutual.subaccord);
  const [accordState] = await findAccordStatePda();

  const instruction = await getFileClaimInstructionAsync({
    claimant,
    rentPayer: claimant,
    mutual: mutual.address,
    claim,
    depositor,
    subaccord: mutual.subaccord,
    memberFeeAta,
    feeFloat,
    feeMint: mutual.feeMint,
    treasury,
    dispute,
    feeVault,
    accordState,
    requested: input.requested,
    evidenceHash: input.evidenceHash,
    nonce,
  });
  return { instruction, fee, claim, dispute };
}

export default class HanseFileClaim extends ChainCommand {
  static summary = "File a claim (fee auto-derived and printed before send)";

  static description =
    "Files a claim as the loaded wallet (must be a member): the requested " +
    "amount is clamped on-chain to the tier's max payout (§2.3), the juror " +
    "fee min_jury_size × fee_per_juror leaves the wallet's fee-mint ATA, " +
    "and the mutual creates the accord Dispute. Evidence is a 32-byte " +
    "manifest hash (§9). One Pending claim per member.";

  static examples = [
    "<%= config.bin %> hanse:file-claim --mutual 9xQe… --amount 2000000000 --evidence <hex64>",
  ];

  static flags = {
    ...chainFlags,
    mutual: Flags.string({ description: "Mutual account address", required: true }),
    amount: Flags.string({
      description: "Requested payout (raw units; clamped on-chain to the tier cap)",
      required: true,
    }),
    evidence: Flags.string({
      description: "Evidence manifest hash (64 hex chars, §9)",
      required: true,
    }),
  };

  async run(): Promise<void> {
    const { flags } = await this.parse(HanseFileClaim);
    this.applyOutput(flags);

    const ctx = await this.loadChain(flags);
    const mutualAccount = await fetchMutual(ctx.rpc, flags.mutual as Address);
    const mutual = mutualAccount.data;
    const subaccord: Subaccord = (await fetchSubaccord(ctx.rpc, mutual.subaccord)).data;

    const build = await buildFileClaim({
      mutual: {
        address: mutualAccount.address,
        claimNonce: mutual.claimNonce,
        pool: mutual.pool,
        subaccord: mutual.subaccord,
        depositMint: mutual.depositMint,
        feeMint: mutual.feeMint,
      },
      subaccord,
      claimant: ctx.signer,
      requested: toBigInt("amount", flags.amount, 64),
      evidenceHash: hexToBytes32("evidence", flags.evidence),
    });

    const feeLine =
      `filing fee: ${groupBigInt(build.fee)} ` +
      `(${subaccord.minJurySize} jurors × ${groupBigInt(subaccord.feePerJuror)})`;
    if (this.out.json) this.logToStderr(feeLine);
    else this.log(feeLine);

    if (flags["dry-run"]) {
      this.emitDryRun(build.instruction);
      return;
    }
    const signature = await this.sendInstruction(ctx, build.instruction);
    this.emitSend(signature, {
      mutual: flags.mutual,
      claim: build.claim,
      dispute: build.dispute,
      fee: build.fee,
    });
  }
}
