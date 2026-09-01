import { type Address, getBase64Decoder, type Rpc, type SolanaRpcApi } from "@solana/kit";
import { describe, expect, test } from "vitest";

import { getPoolEncoder, POOL_PROGRAM_ADDRESS, PoolState } from "../generated/src/generated";
import { fetchMaybeDepositorByOwner, fetchMaybePoolBySeed, fetchPoolBySeed } from "./fetch";
import { findDepositorPda, findPoolPda } from "./pdas";

const MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address;
const AUTHORITY = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM" as Address;

function base64Account(encoded: string) {
  return {
    data: [encoded, "base64"],
    executable: false,
    lamports: 1_000_000n,
    owner: POOL_PROGRAM_ADDRESS,
    rentEpoch: 0n,
    space: 194n,
  };
}

/** Minimal structural rpc mock: only the getAccountInfo path kit's fetch uses. */
function mockRpc(account: ReturnType<typeof base64Account> | null): Rpc<SolanaRpcApi> {
  return {
    getAccountInfo: (_address: string) => ({
      send: async () => ({ value: account }),
    }),
  } as unknown as Rpc<SolanaRpcApi>;
}

function spyRpc(account: ReturnType<typeof base64Account> | null) {
  let queried: string | undefined;
  const rpc = {
    getAccountInfo: (address: string) => {
      queried = address;
      return { send: async () => ({ value: account }) };
    },
  } as unknown as Rpc<SolanaRpcApi>;
  return {
    rpc,
    get queried() {
      return queried;
    },
  };
}

function encodedPool(): string {
  return getBase64Decoder().decode(
    getPoolEncoder().encode({
      mint: MINT,
      state: PoolState.Open,
      ownershipRate: 1n,
      rightsRate: 2n,
      yieldRate: 0n,
      ownershipAuthority: AUTHORITY,
      rightsAuthority: AUTHORITY,
      yieldAuthority: AUTHORITY,
      totalAmount: 0n,
      seed: 0n,
      bump: 255,
      liquidationBalance: 0n,
    }),
  );
}

describe("fetchPoolBySeed", () => {
  test("queries the findPoolPda address and decodes the pool", async () => {
    const spy = spyRpc(base64Account(encodedPool()));
    const rpc = spy.rpc;
    const pool = await fetchPoolBySeed(rpc, { seed: 0n });
    const [expected] = await findPoolPda({ seed: 0n });
    expect(spy.queried).toBe(expected);
    expect(pool.data.state).toBe(PoolState.Open);
    expect(pool.data.mint).toBe(MINT);
    expect(pool.data.rightsRate).toBe(2n);
    expect(pool.data.yieldRate).toBe(0n);
    expect(pool.data.seed).toBe(0n);
  });

  test("throws on missing account", async () => {
    await expect(fetchPoolBySeed(mockRpc(null), { seed: 42n })).rejects.toThrow();
  });

  test("fetchMaybePoolBySeed returns exists:false on missing account", async () => {
    const maybe = await fetchMaybePoolBySeed(mockRpc(null), { seed: 42n });
    expect(maybe.exists).toBe(false);
    const [expected] = await findPoolPda({ seed: 42n });
    expect(maybe.address).toBe(expected);
  });
});

describe("fetchMaybeDepositorByOwner", () => {
  test("queries the findDepositorPda address", async () => {
    const spy = spyRpc(null);
    const rpc = spy.rpc;
    const pool = (await findPoolPda({ seed: 0n }))[0];
    const maybe = await fetchMaybeDepositorByOwner(rpc, { pool, owner: AUTHORITY });
    const [expected] = await findDepositorPda({ pool, owner: AUTHORITY });
    expect(spy.queried).toBe(expected);
    expect(maybe.exists).toBe(false);
  });
});
