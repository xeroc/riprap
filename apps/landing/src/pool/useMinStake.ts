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

/** One shared read: the subaccord floor in micro-USDC, or null until the
 * chain answers. The formatted hook below and the stake form's default clamp
 * ride the same query key — one fetch, two projections. */
function useMinStakeMicroRaw(subaccord: Address | null): bigint | null {
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

  return query.data?.exists ? query.data.data.minStake : null;
}

/** The formatted stake floor ("$10"), or {{PARAM}} until the chain answers. */
export function useMinStake(subaccord: Address | null): string {
  const micro = useMinStakeMicroRaw(subaccord);
  return micro !== null ? usd(microToUsd(micro)) : PARAM;
}

/** The floor in micro-USDC — the stake form's default clamp (a pre-filled
 * default below the floor reverts on submit; copy doc § /app/adjudicate
 * serve panel, 2026-09-27). Null while unread. */
export function useMinStakeMicro(subaccord: Address | null): bigint | null {
  return useMinStakeMicroRaw(subaccord);
}
