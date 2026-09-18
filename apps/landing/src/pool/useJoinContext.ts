// useJoinContext — the hero's pre-flight read (milestone riprap-9ehc HANDOFF
// §2): getJoinContext over the static per-cluster mutual + the connected
// wallet. Runs ONLY when both exist — an anonymous visitor costs the single
// mutual read. TanStack caches by [endpoint, mutual, wallet], so the covered
// stamp survives refetches and a confirmed join (sendInstruction invalidates
// every query) re-reads it as alreadyMember.

import { getJoinContext, type JoinContext } from "@riprap/hanse";
import { useCluster, useWallet } from "@solana/connector";
import { useQuery } from "@tanstack/react-query";

import { useClusterRpc } from "../shared/rpc";
import { resolveMutualAddress } from "./mutual";

export type JoinContextQuery =
  | { state: "off" } // no wallet (or no cluster/address) — nothing to read
  | { state: "loading" }
  | { state: "error" }
  | { state: "ready"; context: JoinContext };

export function useJoinContext(): JoinContextQuery & { refetch: () => void } {
  const { isLocal, isMainnet, isDevnet } = useCluster();
  const clusterRpc = useClusterRpc();
  const address = resolveMutualAddress({ isLocal, isMainnet, isDevnet });
  const { account } = useWallet();

  const enabled = clusterRpc !== null && address !== undefined && account !== null;

  const query = useQuery({
    queryKey: ["join-context", clusterRpc?.endpoint, address, account],
    queryFn: () => {
      if (!clusterRpc || address === undefined || account === null) {
        throw new Error("join-context prerequisites disappeared mid-flight");
      }
      return getJoinContext(clusterRpc.rpc, { mutual: address, wallet: account });
    },
    enabled,
    retry: 1,
  });

  const base: JoinContextQuery = !enabled
    ? { state: "off" }
    : query.isPending
      ? { state: "loading" }
      : query.isError
        ? { state: "error" }
        : { state: "ready", context: query.data };
  return { ...base, refetch: () => void query.refetch() };
}
