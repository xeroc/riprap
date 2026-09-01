import type {
  Account,
  Address,
  FetchAccountConfig,
  MaybeAccount,
  Rpc,
  SolanaRpcApi,
} from "@solana/kit";
import {
  type Depositor,
  fetchDepositor,
  fetchMaybeDepositor,
  fetchMaybePool,
  fetchPool,
  findDepositorPda,
  type Pool,
} from "../generated/src/generated";
import { findPoolPda } from "./pdas";

export async function fetchPoolBySeed(
  rpc: Rpc<SolanaRpcApi>,
  seeds: { seed: bigint },
  config?: FetchAccountConfig,
): Promise<Account<Pool>> {
  const [poolAddress] = await findPoolPda(seeds);
  return await fetchPool(rpc, poolAddress, config);
}

export async function fetchMaybePoolBySeed(
  rpc: Rpc<SolanaRpcApi>,
  seeds: { seed: bigint },
  config?: FetchAccountConfig,
): Promise<MaybeAccount<Pool>> {
  const [poolAddress] = await findPoolPda(seeds);
  return await fetchMaybePool(rpc, poolAddress, config);
}

export async function fetchDepositorByOwner(
  rpc: Rpc<SolanaRpcApi>,
  seeds: { pool: Address; owner: Address },
  config?: FetchAccountConfig,
): Promise<Account<Depositor>> {
  const [depositorAddress] = await findDepositorPda(seeds);
  return await fetchDepositor(rpc, depositorAddress, config);
}

export async function fetchMaybeDepositorByOwner(
  rpc: Rpc<SolanaRpcApi>,
  seeds: { pool: Address; owner: Address },
  config?: FetchAccountConfig,
): Promise<MaybeAccount<Depositor>> {
  const [depositorAddress] = await findDepositorPda(seeds);
  return await fetchMaybeDepositor(rpc, depositorAddress, config);
}
