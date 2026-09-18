// useMinStake — the juror modal's one data figure. The stake floor does NOT
// live on the Mutual (the HANDOFF's "mutual.min_stake" shorthand): it is the
// accord Subaccord's min_stake (set at hanse::initialize CPI time), and
// mutual.subaccord is the pointer. Read through @useaccord/sdk — the single
// source for accord accounts (the landing never decodes them itself).
// Unknown/missing → {{PARAM}} mono placeholder (kit data law), never a
// marketing number. Provenance: policy §12 floor, messaging-guide Numbers
// table ($10 reference; the chain value always wins).

import { usd } from "@riprap/ui";
import type { Address } from "@solana/kit";
import { useQuery } from "@tanstack/react-query";
import { fetchSubaccordMaybe } from "@useaccord/sdk";

import { useClusterRpc } from "../shared/rpc";
import { microToUsd } from "./mutual";

const PARAM = "{{PARAM}}";

/** The formatted stake floor ("$10"), or {{PARAM}} until the chain answers. */
export function useMinStake(subaccord: Address | null): string {
  const clusterRpc = useClusterRpc();
  const enabled = clusterRpc !== null && subaccord !== null;

  const query = useQuery({
    queryKey: ["min-stake", clusterRpc?.endpoint, subaccord],
    queryFn: () => {
      if (!clusterRpc || subaccord === null) {
        throw new Error("min-stake prerequisites disappeared mid-flight");
      }
      return fetchSubaccordMaybe(clusterRpc.rpc, subaccord);
    },
    enabled,
    retry: 1,
  });

  return query.data?.exists ? usd(microToUsd(query.data.data.minStake)) : PARAM;
}
