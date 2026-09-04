import {
  type Address,
  getAddressEncoder,
  getProgramDerivedAddress,
  getU64Encoder,
  type ProgramDerivedAddress,
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

function getBytes(word: string): Uint8Array {
  return new TextEncoder().encode(word);
}
