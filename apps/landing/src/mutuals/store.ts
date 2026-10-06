// The mutuals store — on-chain discovery + resolution to directory
// listings. One getProgramAccounts scan (the SDK's fetchAllMutuals) finds
// every Mutual on the active cluster; each hit's address resolves against
// the pubkeys pinned in data.ts. Pubkeys are not reused across clusters in
// practice, so one registry serves devnet and mainnet — whatever matches
// here is live here. On-chain mutuals with no listing are dropped (not
// shown); listings with nothing on-chain stay drafts and never reach the
// store's output. That is the enable mechanism: a pool appears exactly
// when it exists on-chain.
import { fetchAllMutuals, type Mutual, type ScannedAccount } from "@riprap/hanse";
import { useCluster } from "@solana/connector";
import type { Address } from "@solana/kit";
import { useQuery } from "@tanstack/react-query";
import { useMemo } from "react";

import { useClusterRpc } from "../shared/rpc";
import { MUTUALS } from "./data";
import type { MutualListing } from "./types";

/** A directory listing that is live on the active cluster: the listing,
 *  the on-chain address it resolved to, and its decoded Mutual account. */
export interface LiveMutual {
  listing: MutualListing;
  address: Address;
  account: Mutual;
}

/**
 * The registry the scan resolves against: address → listing. Pinned pubkeys
 * are cluster-agnostic (pubkeys are not reused across clusters in practice);
 * the cluster flags only feed the Blade Pool's env-driven address while its
 * key is unpinned (pool/mutual.ts — the same fallback useMemberCount uses).
 */
export function knownMutuals(listings: MutualListing[] = MUTUALS): Map<Address, MutualListing> {
  const known = new Map<Address, MutualListing>();
  for (const listing of listings) {
    const address = listing?.pubkey;
    if (address !== undefined) known.set(address as Address, listing);
  }
  return known;
}

/** Directory rank — the founder display order (data.ts). */
const RANK = new Map<MutualListing, number>(MUTUALS.map((m, i) => [m, i] as const));

/**
 * Resolve scan hits against the registry: each hit keeps its listing and
 * decoded account; hits without a listing are dropped (not shown). The
 * output keeps the directory's display order, not scan order.
 */
export function resolveLiveMutuals(
  scanned: ScannedAccount<Mutual>[],
  known: Map<Address, MutualListing>,
): LiveMutual[] {
  const live: LiveMutual[] = [];
  for (const hit of scanned) {
    const listing = known.get(hit.address);
    if (listing !== undefined) {
      live.push({ listing, address: hit.address, account: hit.data });
    }
  }
  return live.sort(
    (a, b) => (RANK.get(a.listing) ?? MUTUALS.length) - (RANK.get(b.listing) ?? MUTUALS.length),
  );
}

/** The store's shape: render `state` first, then `pools`. */
export type MutualStore =
  | { state: "off" } // no active cluster — nothing to scan
  | { state: "loading" }
  | { state: "error"; error: unknown; retry: () => void } // scan failed (e.g. RPC refused getProgramAccounts) — retry re-runs it
  | { state: "ready"; pools: LiveMutual[] };

/** Every on-chain mutual on the active cluster, resolved to its listing. */
export function useMutualStore(): MutualStore {
  const clusterRpc = useClusterRpc();
  const { isLocal, isMainnet, isDevnet } = useCluster();
  const known = useMemo(() => knownMutuals(), [isLocal, isMainnet, isDevnet]);

  const query = useQuery({
    queryKey: ["mutuals", clusterRpc?.endpoint],
    queryFn: () => {
      if (!clusterRpc) throw new Error("no cluster rpc for the active cluster");
      return fetchAllMutuals(clusterRpc.rpc);
    },
    enabled: clusterRpc !== null,
    staleTime: 60_000,
    retry: 1,
  });

  if (clusterRpc === null) return { state: "off" };
  if (query.isPending) return { state: "loading" };
  if (query.isError)
    return { state: "error", error: query.error, retry: () => void query.refetch() };
  return { state: "ready", pools: resolveLiveMutuals(query.data, known) };
}
