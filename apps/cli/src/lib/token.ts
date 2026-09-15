/**
 * SPL Token + Associated Token Account (ATA) derivation for `config:balance`.
 *
 * `@solana/kit` v7 does not export the SPL program ids, so they live here.
 * Hand-rolled (no `@solana/spl-token` dependency), matching the on-chain
 * `create_associated_token_account` layout:
 * `ATA_PROGRAM ‖ [owner, TOKEN_PROGRAM, mint]`.
 */
import { type Address, getAddressEncoder, getProgramDerivedAddress } from "@solana/kit";

/** SPL Token program id (not exported by @solana/kit v7). */
export const TOKEN_PROGRAM_ADDRESS = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address;

/** SPL Associated Token Account program id (not exported by @solana/kit v7). */
export const ASSOCIATED_TOKEN_PROGRAM_ADDRESS =
  "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL" as Address;

/**
 * Derive the canonical Associated Token Account (ATA) address for `mint`
 * owned by `owner`. Argument order follows `@solana/spl-token`'s
 * `getAssociatedTokenAddress(mint, owner, …)`.
 */
export async function findAssociatedTokenAddress(mint: Address, owner: Address): Promise<Address> {
  const enc = getAddressEncoder();
  const [ata] = await getProgramDerivedAddress({
    programAddress: ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
    seeds: [enc.encode(owner), enc.encode(TOKEN_PROGRAM_ADDRESS), enc.encode(mint)],
  });
  return ata;
}
