/**
 * rpc.ts — the two-hook RPC seam (ported from the accord dApp).
 *
 *  - `useClusterRpc()` — bare read-only RPC bound to the active ConnectorKit
 *    cluster. Used by views that never need a signer (pool-page reads,
 *    member lookups).
 *  - `useHanseEnv()` — signer-gated write env. Returns `null` until a wallet
 *    is connected; the chip-in path needs it for `sendInstruction`.
 */

import { useCluster, useKitTransactionSigner } from "@solana/connector";
import {
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  type Rpc,
  type RpcSubscriptions,
  type SolanaRpcApi,
  type SolanaRpcSubscriptionsApi,
  type TransactionSigner,
} from "@solana/kit";
import { useMemo } from "react";

export interface ClusterRpc {
  /** Bare endpoint URL of the active cluster. */
  endpoint: string;
  /** Bare read-only RPC bound to the active cluster. */
  rpc: Rpc<SolanaRpcApi>;
  /** WebSocket subscriptions — `sendAndConfirm` needs both. */
  rpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>;
}

/**
 * Read-only RPC bound to the **active ConnectorKit cluster** — the same one
 * the cluster selector drives. Returns `null` only if no cluster is active
 * (should not happen with the default config, but callers should gate).
 */
export function useClusterRpc(): ClusterRpc | null {
  const { cluster } = useCluster();

  return useMemo<ClusterRpc | null>(() => {
    if (!cluster) return null;
    // Cast to string: cluster.url is a MainnetUrl|DevnetUrl|… union that
    // selects a cluster-specific Rpc overload; we want the generic one.
    const url = cluster.url as string;
    const wsUrl = (cluster.urlWs as string) ?? url.replace(/^http/, "ws");
    return {
      endpoint: url,
      rpc: createSolanaRpc(url),
      rpcSubscriptions: createSolanaRpcSubscriptions(wsUrl),
    };
  }, [cluster]);
}

/** Write env: everything {@link useClusterRpc} returns, plus a signer. */
export interface HanseEnv extends ClusterRpc {
  /** The connected wallet's Kit TransactionSigner (fee payer + signer). */
  signer: TransactionSigner;
}

/**
 * Signer-gated write env for the hanse facade. Returns `null` until a wallet
 * is connected — write-path components should early-return when null.
 */
export function useHanseEnv(): HanseEnv | null {
  const clusterRpc = useClusterRpc();
  const { signer } = useKitTransactionSigner();

  return useMemo<HanseEnv | null>(() => {
    if (!clusterRpc || !signer) return null;
    return { ...clusterRpc, signer };
  }, [clusterRpc, signer]);
}
