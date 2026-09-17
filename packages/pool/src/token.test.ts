import type { Address } from "@solana/kit";
import { describe, expect, test } from "vitest";
import {
  ASSOCIATED_TOKEN_PROGRAM_ADDRESS,
  findAssociatedTokenAddress,
  TOKEN_PROGRAM_ADDRESS,
} from "./token";

/**
 * Vector continuity: the derivation this module replaced (the hand-rolled
 * `ATA_PROGRAM ‖ [owner, TOKEN_PROGRAM, mint]` PDA in apps/cli/src/lib/token.ts)
 * produced this address for this (mint, owner) pair. If the
 * `@solana-program/token` helper ever derives differently, this fails.
 */
const DEVNET_USDC = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU" as Address;
const OWNER = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM" as Address;
const EXPECTED_ATA = "HwpBSwuyVKJi7d9kqqNexc54MS9i4BEDKDVDLeUVjZm8";

describe("token", () => {
  test("program ids are the canonical SPL ids", () => {
    expect(TOKEN_PROGRAM_ADDRESS).toBe("TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA");
    expect(ASSOCIATED_TOKEN_PROGRAM_ADDRESS).toBe("ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL");
  });

  test("findAssociatedTokenAddress(mint, owner) matches the create_associated_token_account layout", async () => {
    expect(await findAssociatedTokenAddress(DEVNET_USDC, OWNER)).toBe(EXPECTED_ATA);
  });
});
