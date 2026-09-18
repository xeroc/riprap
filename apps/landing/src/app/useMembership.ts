// useMembership — the /app member read (riprap-c1r1): fetchMaybeMemberByOwner
// for the connected wallet against the static per-cluster mutual map. Runs
// only once a wallet is connected; `member: null` is the honest
// not-in-this-pool state, never an error (HANDOFF §3: states, not toasts).

import { fetchMaybeMemberByOwner, type Member } from "@riprap/hanse";
import { useCluster, useWallet } from "@solana/connector";
import { useQuery } from "@tanstack/react-query";

import { resolveMutualAddress } from "../pool/mutual";
import { useClusterRpc } from "../shared/rpc";

export type MembershipQuery =
  | { state: "off" } // no wallet (or no mutual on this cluster) — nothing to read
  | { state: "loading" }
  | { state: "error"; retry: () => void }
  | { state: "ready"; member: Member | null };

export function useMembership(): MembershipQuery {
  const { isLocal, isMainnet, isDevnet } = useCluster();
  const clusterRpc = useClusterRpc();
  const address = resolveMutualAddress({ isLocal, isMainnet, isDevnet });
  const { account } = useWallet();

  const enabled = clusterRpc !== null && address !== undefined && account !== null;

  const query = useQuery({
    queryKey: ["member", clusterRpc?.endpoint, address, account],
    queryFn: async () => {
      if (!clusterRpc || address === undefined || account === null) {
        throw new Error("membership prerequisites disappeared mid-flight");
      }
      const maybe = await fetchMaybeMemberByOwner(clusterRpc.rpc, {
        mutual: address,
        member: account,
      });
      return maybe.exists ? maybe.data : null;
    },
    enabled,
    retry: 1,
  });

  if (!enabled) return { state: "off" };
  if (query.isPending) return { state: "loading" };
  if (query.isError) return { state: "error", retry: () => void query.refetch() };
  return { state: "ready", member: query.data };
}
