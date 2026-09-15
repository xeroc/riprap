import { sha256 } from "@noble/hashes/sha256";
import {
  type Address,
  getAddressEncoder,
  getProgramDerivedAddress,
  getU64Encoder,
  type ProgramDerivedAddress,
  type ReadonlyUint8Array,
} from "@solana/kit";
import { HANSE_PROGRAM_ADDRESS } from "../generated/src/generated";

export { findDepositorPda, findPoolPda } from "@riprap/pool";
// Generated seed helpers (member/claim/authority PDAs) — re-exported so the
// e2e imports one module. Pool-side passthroughs (treasury = pool PDA,
// depositor) come from @riprap/pool for the same reason.
export {
  type ClaimSeeds,
  findClaimPda,
  findJoinMemberAccountPda,
  findMemberAccountPda,
  findOwnershipAuthorityPda,
  findRightsAuthorityPda,
  type JoinMemberAccountSeeds,
  type MemberAccountSeeds,
  type OwnershipAuthoritySeeds,
  type RightsAuthoritySeeds,
} from "../generated/src/generated";

export type MutualSeeds = {
  seed: bigint;
};

/**
 * Mutual PDA, seeds = ["mutual", seed le u64] (programs/hanse state.rs
 * MUTUAL_SEED; EVENT-MUTUAL §6). Codama cannot emit this helper because the
 * seed is an instruction argument, not an account.
 */
export async function findMutualPda(
  seeds: MutualSeeds,
  config: { programAddress?: Address | undefined } = {},
): Promise<ProgramDerivedAddress> {
  const { programAddress = HANSE_PROGRAM_ADDRESS } = config;
  return await getProgramDerivedAddress({
    programAddress,
    seeds: [getBytes("mutual"), getU64Encoder().encode(seeds.seed)],
  });
}

/** Associated Token program (spl-associated-token-account 2.3.0 declare_id). */
const ASSOCIATED_TOKEN_PROGRAM_ADDRESS = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL" as Address;

/** Classic SPL Token program — what initialize_mutual's fee_float ATA uses. */
const TOKEN_PROGRAM_ADDRESS = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address;

export type FeeFloatSeeds = {
  /** The mutual PDA — ATA owner/authority. */
  mutual: Address;
  feeMint: Address;
};

/**
 * Fee float: the mutual PDA's ATA of fee_mint (initialize_mutual.rs
 * associated_token::authority = mutual, mint = fee_mint, classic Token
 * program). Layout per spl-associated-token-account 2.3.0
 * get_associated_token_address_with_program_id:
 * find_program_address([owner, token_program, mint], ATA program).
 */
export async function findFeeFloatPda(
  seeds: FeeFloatSeeds,
  config: { associatedTokenProgramAddress?: Address | undefined } = {},
): Promise<ProgramDerivedAddress> {
  const { associatedTokenProgramAddress = ASSOCIATED_TOKEN_PROGRAM_ADDRESS } = config;
  const addressEncoder = getAddressEncoder();
  return await getProgramDerivedAddress({
    programAddress: associatedTokenProgramAddress,
    seeds: [
      addressEncoder.encode(seeds.mutual),
      addressEncoder.encode(TOKEN_PROGRAM_ADDRESS),
      addressEncoder.encode(seeds.feeMint),
    ],
  });
}

/** Accord program id (programs/hanse Cargo.toml git dep, rev ba91bd8). */
const ACCORD_PROGRAM_ADDRESS = "cordhVoshqRV6kzGBmM89A66wuusJGsDCvLMHPLyKed" as Address;

export type MutualSubaccordSeeds = {
  /**
   * The initializer wallet — the subaccord PDA's creator seed
   * (initialize_mutual.rs: the CPI creator is `authority`, NOT the mutual
   * PDA; a data-carrying PDA cannot pay rent, Synod file_dispute precedent).
   */
  creator: Address;
  seed: bigint;
  policyHash: ReadonlyUint8Array;
};

/**
 * Juror namespace binding: `H("hanse:subaccord" ‖ seed_le_u64 ‖ policy_hash)`
 * (programs/hanse initialize_mutual.rs `subaccord_domain_ref`). Binding the
 * cover-terms hash means a policy change is necessarily a new subaccord.
 */
export function subaccordDomainRef(seed: bigint, policyHash: ReadonlyUint8Array): Uint8Array {
  return sha256(
    concatBytes(
      getBytes("hanse:subaccord"),
      getU64Encoder().encode(seed),
      new Uint8Array(policyHash),
    ),
  );
}

/**
 * The subaccord a mutual initializes: PDA ["subaccord", creator, domain_ref]
 * under the accord program (accord constants.rs SEED_SUBACCORD). Codama
 * cannot emit this — cross-program seeds with a hashed argument.
 */
export async function findMutualSubaccordPda(
  seeds: MutualSubaccordSeeds,
  config: { programAddress?: Address | undefined } = {},
): Promise<ProgramDerivedAddress> {
  const { programAddress = ACCORD_PROGRAM_ADDRESS } = config;
  return await getProgramDerivedAddress({
    programAddress,
    seeds: [
      getBytes("subaccord"),
      getAddressEncoder().encode(seeds.creator),
      subaccordDomainRef(seeds.seed, seeds.policyHash),
    ],
  });
}

function getBytes(word: string): Uint8Array {
  return new TextEncoder().encode(word);
}

function concatBytes(...parts: ReadonlyUint8Array[]): Uint8Array {
  const out = new Uint8Array(parts.reduce((n, p) => n + p.length, 0));
  let at = 0;
  for (const p of parts) {
    out.set(p, at);
    at += p.length;
  }
  return out;
}
