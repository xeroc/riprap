import { fetchPool } from "@riprap/pool";
import type { Address } from "@solana/kit";

import type { ChainRpc } from "./base-command";

/**
 * The pool's one token: from `--mint` when given, else read from the pool
 * account (one RPC round-trip). Pass `--mint` to build `--dry-run`
 * instructions fully offline.
 */
export async function resolvePoolMint(
  rpc: ChainRpc,
  pool: Address,
  override?: string,
): Promise<Address> {
  if (override) return override as Address;
  const account = await fetchPool(rpc, pool);
  return account.data.mint;
}
