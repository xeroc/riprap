// mint.ts — the #/create wizard's default contribution/fee mint, per
// connected cluster (the evidenceServer shape: pure resolvers, env-free
// tests, one hook over useCluster). The pool is created with ONE classic
// SPL mint; the prefill must be a mint that exists on the deploy cluster:
// mainnet USDC on mainnet, devnet USDC on devnet (SETUP.BLADE-POOL.md §4.2
// devnet example), localnet sharing the devnet mint unless
// VITE_DEPOSIT_MINT_LOCALNET pins its own (a surfnet mint is arbitrary).
// No cluster yet (boot frame) or an unknown id resolves to null — the
// prefill never moves on a guess. Source: 2026-10-19 dogfood — the mainnet
// prefill on devnet simulated AccountOwnedByWrongProgram (deposit_mint
// system-owned: the account isn't there).

import { useCluster } from "@solana/connector";

import { USDC_MINT } from "./doc";

/** Devnet USDC — the runbook's devnet mint (SETUP.BLADE-POOL.md §4.2). */
export const DEVNET_USDC_MINT = "4zMMC9srt5Ri5X14GAgXhaHii3GnPAEERYPJgZJDncDU";

/** Env shape the resolver reads — `import.meta.env` in the app, a plain
 * record in tests (the functions stay env-free and node-test-clean). */
export type DepositMintEnv = Record<string, string | undefined>;

/** The default mint for an active cluster id; null while the cluster is
 * unknown (boot frame / unknown ids) — nothing moves on a guess. */
export function depositMintForCluster(
  clusterId: string | null | undefined,
  env: DepositMintEnv,
): string | null {
  if (clusterId === "solana:mainnet" || clusterId === "solana:mainnet-beta") return USDC_MINT;
  if (clusterId === "solana:devnet") return DEVNET_USDC_MINT;
  if (clusterId === "solana:localnet") {
    return env.VITE_DEPOSIT_MINT_LOCALNET ?? DEVNET_USDC_MINT;
  }
  return null;
}

/** The connected cluster's default mint (null = not known yet). */
export function useClusterDepositMint(): string | null {
  const { cluster } = useCluster();
  return depositMintForCluster(cluster?.id, import.meta.env as DepositMintEnv);
}

/** Drag a stale prefill to the connected cluster: a never-authored blank,
 * or one of the two USDC defaults saved under another cluster, follows the
 * cluster; a mint the author set is never touched. The other cluster's
 * USDC cannot deploy here (the account isn't there), so the swap is always
 * the way out, never the author's mistake. */
export function alignDepositMint(mint: string, clusterMint: string | null): string {
  if (clusterMint === null || mint === clusterMint) return mint;
  return mint === "" || mint === USDC_MINT || mint === DEVNET_USDC_MINT ? clusterMint : mint;
}
