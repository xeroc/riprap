// useMutual — the pool page's single chain read: the mutual account, by the
// static per-cluster address. TanStack caches by [endpoint, address], so the
// hero and the fineprint share one fetch. The states are exhaustive on
// purpose — the copy doc's "renders nothing it wasn't told" law leaves no
// room for a fallback tier state.

import { fetchMaybeMutual, type Mutual } from "@riprap/hanse";
import { useCluster } from "@solana/connector";
import { useQuery } from "@tanstack/react-query";

import { useClusterRpc } from "../shared/rpc";
import { depositsOpenAt, resolveMutualAddress } from "./mutual";

export type MutualQuery =
  | { state: "loading" }
  | { state: "error"; retry: () => void }
  | { state: "not-found" }
  | { state: "ready"; mutual: Mutual; depositsOpen: boolean };

export function useMutual(): MutualQuery {
  const { isLocal, isMainnet, isDevnet } = useCluster();
  const clusterRpc = useClusterRpc();
  const address = resolveMutualAddress({ isLocal, isMainnet, isDevnet });

  const query = useQuery({
    queryKey: ["mutual", clusterRpc?.endpoint, address],
    queryFn: () => {
      if (!clusterRpc || address === undefined) {
        throw new Error("no cluster rpc or mutual address for the active cluster");
      }
      return fetchMaybeMutual(clusterRpc.rpc, address);
    },
    enabled: clusterRpc !== null && address !== undefined,
    retry: 1,
  });

  // No configured deployment for this cluster — honest not-live, before any
  // fetch is attempted (the query is disabled in this case anyway).
  if (address === undefined) return { state: "not-found" };
  if (query.isPending) return { state: "loading" };
  if (query.isError) return { state: "error", retry: () => void query.refetch() };
  const account = query.data;
  if (!account.exists) return { state: "not-found" };
  return {
    state: "ready",
    mutual: account.data,
    depositsOpen: depositsOpenAt(account.data.depositsCloseAt),
  };
}
