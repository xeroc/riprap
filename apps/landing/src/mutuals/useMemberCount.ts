// useMemberCount — the live member count behind a card's "members needed"
// row. Pools route by their pinned pubkey; the Blade Pool (no pinned key
// yet) falls back to the env-bound per-cluster mutual address
// (pool/mutual.ts resolveMutualAddress). Pools without a resolvable
// address — the drafts — return undefined, and stillNeeded() falls back to
// the full count. TanStack caches by [endpoint, address], so the 18 cards
// on the duplicated drift rail share one fetch.
import { fetchMemberCount } from "@riprap/hanse";
import type { Address } from "@solana/kit";
import { useQuery } from "@tanstack/react-query";

import { useClusterRpc } from "../shared/rpc";
import type { MutualListing } from "./types";

export function useMemberCount(pool: MutualListing): number | undefined {
  const clusterRpc = useClusterRpc();
  const address = pool?.pubkey as Address | undefined;

  const query = useQuery({
    queryKey: ["member-count", clusterRpc?.endpoint, address],
    queryFn: () => {
      if (!clusterRpc || address === undefined) {
        throw new Error("no cluster rpc or mutual address for the active cluster");
      }
      return fetchMemberCount(clusterRpc.rpc, address);
    },
    enabled: clusterRpc !== null && address !== undefined,
    staleTime: 60_000,
    retry: 1,
  });

  return query.data;
}
