/**
 * SPL Token + Associated Token Account (ATA) plumbing — the SDK single
 * source for ATA derivation and the SPL program ids (moved here from
 * `apps/cli/src/lib/token.ts`).
 *
 * Derivation and the idempotent ATA-create instruction builder come from
 * `@solana-program/token` (the kit-v7-paired release; the ATA program
 * client ships inside it — no separate associated-token package exists).
 */

import type { Address } from "@solana/kit";
import { findAssociatedTokenPda, TOKEN_PROGRAM_ADDRESS } from "@solana-program/token";

export {
  ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
  getCreateAssociatedTokenIdempotentInstruction,
  getCreateAssociatedTokenIdempotentInstructionAsync,
  TOKEN_PROGRAM_ADDRESS,
} from "@solana-program/token";

/**
 * Derive the canonical Associated Token Account (ATA) address for `mint`
 * owned by `owner`. Argument order follows `@solana/spl-token`'s
 * `getAssociatedTokenAddress(mint, owner, …)` — unchanged from the CLI
 * lib this replaced.
 */
export async function findAssociatedTokenAddress(mint: Address, owner: Address): Promise<Address> {
  const [ata] = await findAssociatedTokenPda({
    owner,
    mint,
    tokenProgram: TOKEN_PROGRAM_ADDRESS,
  });
  return ata;
}
