import { findDepositorPda, getDepositorEncoder, getPoolEncoder, PoolState } from "@riprap/pool";
import {
  type Address,
  type Commitment,
  getBase64Decoder,
  type Rpc,
  type SolanaRpcApi,
} from "@solana/kit";
import { describe, expect, test } from "vitest";

import { buildDepositorView } from "./depositor";
import { buildPoolView } from "./show";

/**
 * Read commands against decoded fixtures: pool + depositor accounts encoded
 * with the SDK encoders, served through a minimal structural rpc mock (the
 * packages/pool fetch.test.ts pattern). No validator needed.
 */
const POOL_ADDR = "9xQeWvG816bUx9EPa7X8ZyNYBE6yW8zH2XUFmfYqjEEx" as Address;
const MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address;
const AUTHORITY = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM" as Address;
const OWNER = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL" as Address;

const COMMITMENT: Commitment = "confirmed";
const TOKEN_BALANCE = 1_000_000n;
const DEPOSITOR_PDA = await findDepositorPda({ pool: POOL_ADDR, owner: OWNER }).then(
  ([pda]) => pda,
);

/** Pubkey::default() on-chain — an unset residual beneficiary. */
const NO_BENEFICIARY = "11111111111111111111111111111111" as Address;

function encodedPool(state: PoolState, totalAmount: bigint, liquidationBalance = 0n): string {
  const raw = getPoolEncoder().encode({
    mint: MINT,
    state,
    ownershipRate: 1n,
    rightsRate: 2n,
    yieldRate: 0n,
    ownershipAuthority: AUTHORITY,
    rightsAuthority: AUTHORITY,
    yieldAuthority: AUTHORITY,
    totalAmount,
    seed: 7n,
    bump: 255,
    liquidationBalance,
  });
  return getBase64Decoder().decode(raw);
}

function encodedDepositor(totalAmount: bigint): string {
  const raw = getDepositorEncoder().encode({
    owner: OWNER,
    residualBeneficiary: NO_BENEFICIARY,
    totalAmount,
    ownershipStake: totalAmount,
    rightsStake: 2n * totalAmount,
    yieldStake: 0n,
    settled: false,
  });
  return getBase64Decoder().decode(raw);
}

function account(encoded: string) {
  return {
    data: [encoded, "base64"],
    executable: false,
    lamports: 1n,
    owner: POOL_ADDR,
    rentEpoch: 0n,
    space: 194n,
  };
}

/** Minimal structural rpc: account bytes by address, fixed token balance. */
function mockRpc(accounts: Record<string, string>): Rpc<SolanaRpcApi> {
  return {
    getAccountInfo: (address: string) => ({
      send: async () => ({ value: accounts[address] ? account(accounts[address]) : null }),
    }),
    getTokenAccountBalance: (_address: string) => ({
      send: async () => ({
        value: { amount: String(TOKEN_BALANCE), decimals: 6, uiAmountString: "1.000000" },
      }),
    }),
  } as unknown as Rpc<SolanaRpcApi>;
}

describe("buildPoolView (pool:show)", () => {
  test("open pool: payout base is the live treasury balance", async () => {
    const view = await buildPoolView(
      mockRpc({ [POOL_ADDR]: encodedPool(PoolState.Open, 400n) }),
      POOL_ADDR,
      COMMITMENT,
    );
    expect(view.pool.mint).toBe(MINT);
    expect(view.pool.state).toBe(PoolState.Open);
    expect(view.treasuryBalance).toBe(TOKEN_BALANCE);
    expect(view.payoutBase).toBe(TOKEN_BALANCE);
    expect(view.baseSource).toBe("live");
  });

  test("liquidated pool: payout base is the frozen liquidation balance", async () => {
    const view = await buildPoolView(
      mockRpc({ [POOL_ADDR]: encodedPool(PoolState.Liquidated, 400n, 800_000n) }),
      POOL_ADDR,
      COMMITMENT,
    );
    expect(view.treasuryBalance).toBe(TOKEN_BALANCE);
    expect(view.payoutBase).toBe(800_000n);
    expect(view.baseSource).toBe("liquidation");
  });
});

describe("buildDepositorView (pool:depositor)", () => {
  test("money-weighted preview against the live balance (crank.rs payout)", async () => {
    // 1_000_000 × 100 / 400 = 250_000
    const view = await buildDepositorView(
      mockRpc({
        [POOL_ADDR]: encodedPool(PoolState.Open, 400n),
        [DEPOSITOR_PDA]: encodedDepositor(100n),
      }),
      POOL_ADDR,
      OWNER,
      COMMITMENT,
    );
    expect(view.depositor.owner).toBe(OWNER);
    expect(view.depositor.totalAmount).toBe(100n);
    expect(view.depositorAddress).toBe(DEPOSITOR_PDA);
    expect(view.payoutBase).toBe(TOKEN_BALANCE);
    expect(view.previewPayout).toBe(250_000n);
  });

  test("liquidated pool previews against the frozen base", async () => {
    const view = await buildDepositorView(
      mockRpc({
        [POOL_ADDR]: encodedPool(PoolState.Liquidated, 400n, 800_000n),
        [DEPOSITOR_PDA]: encodedDepositor(100n),
      }),
      POOL_ADDR,
      OWNER,
      COMMITMENT,
    );
    expect(view.payoutBase).toBe(800_000n);
    expect(view.previewPayout).toBe(200_000n); // 800_000 × 100 / 400
  });

  test("missing depositor position errors deadpan", async () => {
    await expect(
      buildDepositorView(
        mockRpc({ [POOL_ADDR]: encodedPool(PoolState.Open, 400n) }),
        POOL_ADDR,
        OWNER,
        COMMITMENT,
      ),
    ).rejects.toThrow(/No depositor position/);
  });
});
