// tokens.ts — SPL Mint + token-account setup for the mutual's USDC-like flow.
//
// Ported verbatim from the accord harness. Surfpool has
// `surfnet_setTokenAccount` (high-level ATA setter) but NO `setMint`, so the
// Mint account is hand-encoded (Token Program layout, 82 B) and written via
// `surfnet_setAccount`. Member/vault balances use the high-level ATA
// cheatcode. This keeps token setup dependency-free — do NOT import
// `@solana/spl-token` here: it pulls web3.js v1, whose `uuid` CJS dep breaks
// jest ESM (accord harness note).

import {
  type Address,
  generateKeyPairSigner,
  getAddressEncoder,
  getProgramDerivedAddress,
  type KeyPairSigner,
} from "@solana/kit";
import { cheat, setAccountRaw } from "./cheats.js";
import type { TestEnv } from "./env.js";

/** SPL Token program (`TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA`). */
export const TOKEN_PROGRAM_ID = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address;

/** 82-byte Token-program Mint: COption<mint_auth> ‖ supply ‖ decimals ‖ init ‖ COption<freeze_auth>. */
function encodeMint(authority: Address, decimals: number): Uint8Array {
  const bytes = new Uint8Array(82);
  const view = new DataView(bytes.buffer);
  const authBytes = getAddressEncoder().encode(authority); // 32
  view.setUint32(0, 1, true); // mint_authority = Some
  bytes.set(authBytes, 4);
  view.setBigUint64(36, 0n, true); // supply = 0
  bytes[44] = decimals;
  bytes[45] = 1; // is_initialized
  view.setUint32(46, 0, true); // freeze_authority = None
  return bytes;
}

export interface CreatedMint {
  mint: Address;
  /** Mint authority — the minter for later real `mintTo` flows. */
  authority: KeyPairSigner;
  decimals: number;
}

/**
 * Materialize a fresh SPL Mint owned by the Token program, with `authority` as
 * mint authority. Defaults to 6 decimals — the USDC-like unit the mutual's
 * tier table is denominated in (policy §2). Uses the `surfnet_setAccount`
 * cheatcode (no rent tx needed).
 */
export async function createMint(env: TestEnv, decimals = 6): Promise<CreatedMint> {
  const authority = await generateKeyPairSigner();
  const mint = authority.address;
  await setAccountRaw(env, mint, {
    lamports: 2_000_000_000, // well over 82-B rent
    data: encodeMint(authority.address, decimals),
    owner: TOKEN_PROGRAM_ID,
  });
  return { mint, authority, decimals };
}

/**
 * Set (or overwrite) an associated token account's balance via the
 * `surfnet_setTokenAccount` cheatcode. Creates the ATA at associated(mint, owner)
 * with the given amount — no mintTo / ATA-creation tx required.
 */
export async function setTokenBalance(
  env: TestEnv,
  owner: Address,
  mint: Address,
  amount: bigint,
): Promise<void> {
  await cheat(env, "surfnet_setTokenAccount", [owner, mint, { amount: Number(amount) }]);
}

// --- ATA derivation (shared — no per-spec copies) ---------------------------

/** Associated Token Account program (`ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL`). */
export const ATA_PROGRAM_ID = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL" as Address;

/**
 * Derive the canonical ATA for (mint, owner) the way the program does
 * (seeds: owner ‖ token program ‖ mint). Use for vault + member accounts.
 */
export async function ataOf(mint: Address, owner: Address): Promise<Address> {
  const enc = getAddressEncoder();
  const [ata] = await getProgramDerivedAddress({
    programAddress: ATA_PROGRAM_ID,
    seeds: [
      new Uint8Array(enc.encode(owner)),
      new Uint8Array(enc.encode(TOKEN_PROGRAM_ID)),
      new Uint8Array(enc.encode(mint)),
    ],
  });
  return ata;
}
