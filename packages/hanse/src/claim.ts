/**
 * claim.ts — build-only file-claim facade: everything `hanse::file_claim`
 * needs assembled from decoded accounts (EVENT-MUTUAL §7): the Claim PDA at
 * the mutual's nonce, the depositor, the fee ATA path, and the fee derived
 * live from the subaccord. Pure — the caller owns the fetches and the two
 * cross-program PDAs (`dispute`, `accordState` via @useaccord/sdk), so this
 * module adds no new SDK dependency. Single source for the CLI and the
 * wizard (no parallel instruction assemblies).
 */
import { findAssociatedTokenAddress, findDepositorPda } from "@riprap/pool";
import type { Address, Instruction, TransactionSigner } from "@solana/kit";

import { findClaimPda, getFileClaimInstructionAsync } from "../generated/src/generated";
import { findFeeFloatPda } from "./pdas";

/** The live fee inputs file-claim derives off the subaccord (§2.6). */
export interface FileClaimFeeSource {
  minJurySize: number;
  feePerJuror: bigint;
}

/** Mutual fields file-claim derives everything from (decoded account shape). */
export interface FileClaimMutual {
  address: Address;
  claimNonce: bigint;
  pool: Address;
  subaccord: Address;
  feeMint: Address;
}

export interface FileClaimBuild {
  instruction: Instruction;
  /** min_jury_size × fee_per_juror, micro. */
  fee: bigint;
  claim: Address;
  dispute: Address;
  /** The nonce used — the claim's on-chain number. */
  nonce: bigint;
}
/**
 * Filing fee = min_jury_size × fee_per_juror (EVENT-MUTUAL §2.6; §12 pilot:
 * 3 × 5 USDC = 15 USDC). u64-checked — the program re-verifies; this exists
 * so callers can show the fee before sending. Single source (CLI + wizard).
 */
export function juryFee(minJurySize: number, feePerJuror: bigint): bigint {
  if (!Number.isInteger(minJurySize) || minJurySize <= 0) {
    throw new Error(`min_jury_size must be a positive integer (got ${minJurySize}).`);
  }
  const fee = BigInt(minJurySize) * feePerJuror;
  if (fee >= 1n << 64n) {
    throw new Error(`jury fee overflows u64 (${minJurySize} × ${feePerJuror}).`);
  }
  return fee;
}

/** Assemble `hanse::file_claim` from decoded accounts — no rpc, no fetches. */
export async function buildFileClaim(input: {
  mutual: FileClaimMutual;
  subaccord: FileClaimFeeSource;
  claimant: TransactionSigner;
  requested: bigint;
  /** sha256(manifest) — passed through verbatim (§7 amendment 2026-09-22). */
  evidenceHash: Uint8Array;
  /** accord Dispute PDA at (filer = mutual, nonce) — caller-derived. */
  dispute: Address;
  /** The accord singleton state PDA — caller-derived via @useaccord/sdk. */
  accordState: Address;
}): Promise<FileClaimBuild> {
  const { mutual, claimant } = input;
  const fee = juryFee(input.subaccord.minJurySize, input.subaccord.feePerJuror);
  const nonce = mutual.claimNonce;

  const [claim] = await findClaimPda({ mutual: mutual.address, nonce });
  const [depositor] = await findDepositorPda({ pool: mutual.pool, owner: claimant.address });
  const memberFeeAta = await findAssociatedTokenAddress(mutual.feeMint, claimant.address);
  const [feeFloat] = await findFeeFloatPda({ mutual: mutual.address, feeMint: mutual.feeMint });
  const feeVault = await findAssociatedTokenAddress(mutual.feeMint, mutual.subaccord);

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
    dispute: input.dispute,
    feeVault,
    accordState: input.accordState,
    requested: input.requested,
    evidenceHash: input.evidenceHash,
    nonce,
  });
  return { instruction, fee, claim, dispute: input.dispute, nonce };
}
