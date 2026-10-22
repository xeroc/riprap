// mint.test.ts — the wizard's default mint per cluster (mint.ts): mainnet
// USDC on mainnet, devnet USDC on devnet, localnet pinned or devnet. The
// alignment drags a stale prefill to the connected cluster and never touches
// a mint the author set. Source: 2026-10-19 dogfood — the deploy simulated
// AccountOwnedByWrongProgram on deposit_mint (the mainnet USDC prefill is
// system-owned on devnet, the account isn't there).

import { describe, expect, it } from "vitest";

import { alignDepositMint, depositMintForCluster } from "./mint";

const USDC = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v"; // mainnet USDC
// Devnet USDC — the runbook's devnet mint (SETUP.BLADE-POOL.md §4.2 example).
const DEVNET_USDC = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";
const CUSTOM = "9xQeWvG816bUx9EPjHmaT23yvVM2ZWbrrpZb9PusVFin"; // any author-typed mint

describe("depositMintForCluster — one default mint per cluster", () => {
  it("mainnet (both ids) prefills mainnet USDC", () => {
    expect(depositMintForCluster("solana:mainnet", {})).toBe(USDC);
    expect(depositMintForCluster("solana:mainnet-beta", {})).toBe(USDC);
  });

  it("devnet prefills devnet USDC", () => {
    expect(depositMintForCluster("solana:devnet", {})).toBe(DEVNET_USDC);
  });

  it("localnet shares the devnet mint unless VITE_DEPOSIT_MINT_LOCALNET pins its own", () => {
    expect(depositMintForCluster("solana:localnet", {})).toBe(DEVNET_USDC);
    expect(
      depositMintForCluster("solana:localnet", {
        VITE_DEPOSIT_MINT_LOCALNET: CUSTOM,
      }),
    ).toBe(CUSTOM);
  });

  it("no cluster yet (boot frame) and unknown ids stay null — the prefill never moves on a guess", () => {
    expect(depositMintForCluster(null, {})).toBeNull();
    expect(depositMintForCluster(undefined, {})).toBeNull();
    expect(depositMintForCluster("solana:testnet", {})).toBeNull();
  });
});

describe("alignDepositMint — the prefill follows the connected cluster", () => {
  it("a never-authored blank takes the cluster's mint", () => {
    expect(alignDepositMint("", DEVNET_USDC)).toBe(DEVNET_USDC);
  });

  it("a stale other-cluster USDC prefill follows the cluster (mainnet → devnet and back)", () => {
    expect(alignDepositMint(USDC, DEVNET_USDC)).toBe(DEVNET_USDC);
    expect(alignDepositMint(DEVNET_USDC, USDC)).toBe(USDC);
  });

  it("a mint the author set is never touched", () => {
    expect(alignDepositMint(CUSTOM, DEVNET_USDC)).toBe(CUSTOM);
  });

  it("no cluster yet leaves everything as is; the cluster's own mint is a no-op", () => {
    expect(alignDepositMint(USDC, null)).toBe(USDC);
    expect(alignDepositMint(DEVNET_USDC, DEVNET_USDC)).toBe(DEVNET_USDC);
  });
});
