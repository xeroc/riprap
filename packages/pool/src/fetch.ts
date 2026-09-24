import type {
  Account,
  Address,
  FetchAccountConfig,
  MaybeAccount,
  Rpc,
  SolanaRpcApi,
} from "@solana/kit";
import {
  type Base64EncodedBytes,
  type GetProgramAccountsApi,
  getBase64Decoder,
  getBase64Encoder,
} from "@solana/kit";
import {
  DEPOSITOR_DISCRIMINATOR,
  type Depositor,
  fetchDepositor,
  fetchMaybeDepositor,
  fetchMaybePool,
  fetchPool,
  findDepositorPda,
  getDepositorDecoder,
  POOL_PROGRAM_ADDRESS,
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

/**
 * A decoded scan hit: address + decoded data (no rent wrapper — consumers
 * of scans only read state, never re-encode).
 */
export type ScannedAccount<T> = { address: Address; data: T };

/**
 * Every Depositor position of one pool (cranker residual sweep). The pool
 * key lives in the PDA seeds, not the account data, so the scan filters by
 * discriminator server-side and matches each account against the derived
 * `["depositor", pool, owner]` PDA client-side. Malformed accounts are
 * skipped, not thrown.
 */
export async function fetchDepositorsOfPool(
  rpc: Rpc<SolanaRpcApi & GetProgramAccountsApi>,
  pool: Address,
): Promise<ScannedAccount<Depositor>[]> {
  const results = await rpc
    .getProgramAccounts(POOL_PROGRAM_ADDRESS, {
      encoding: "base64",
      filters: [
        {
          memcmp: {
            offset: 0n,
            bytes: getBase64Decoder().decode(DEPOSITOR_DISCRIMINATOR) as Base64EncodedBytes,
            encoding: "base64",
          },
        },
      ],
    })
    .send();
  const toBytes = getBase64Encoder();
  const out: ScannedAccount<Depositor>[] = [];
  for (const r of results as readonly {
    readonly pubkey: string;
    readonly account: { readonly data: readonly [string, "base64"] };
  }[]) {
    let decoded: Depositor;
    try {
      decoded = getDepositorDecoder().decode(toBytes.encode(r.account.data[0]));
    } catch {
      continue;
    }
    const [expected] = await findDepositorPda({ pool, owner: decoded.owner });
    if (expected === r.pubkey) {
      out.push({ address: r.pubkey as Address, data: decoded });
    }
  }
  return out;
}
