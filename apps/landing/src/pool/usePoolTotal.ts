// usePoolTotal — the covered overlay's "pool holds {{total}}" figure. The
// pool account (the three-track primitive) sums every member contribution in
// total_amount; the mutual points at it (mutual.pool). Read through
// @riprap/hanse's @riprap/pool re-export — the SDK packages are the single
// source (no hand-rolled decoders on the landing). Unknown or missing →
// {{PARAM}} mono placeholder (kit data law), never a marketing number.
// Provenance: the chain's pool.total_amount (micro-USDC), formatted via usd().
import { fetchPool } from "@riprap/hanse";
import { usd } from "@riprap/ui";
import type { Address } from "@solana/kit";
import { useQuery } from "@tanstack/react-query";

import { useClusterRpc } from "../shared/rpc";
import { microToUsd } from "./mutual";

const PARAM = "{{PARAM}}";

/** The formatted pool total ("$4,020"), or {{PARAM}} until the chain answers. */
export function usePoolTotal(pool: Address | null): {
  amount: number;
  displayAmount: string;
} {
  const clusterRpc = useClusterRpc();
  const enabled = clusterRpc !== null && pool !== null;

  const query = useQuery({
    queryKey: ["pool-total", clusterRpc?.endpoint, pool],
    queryFn: () => {
      if (!clusterRpc || pool === null) {
        throw new Error("pool-total prerequisites disappeared mid-flight");
      }
      return fetchPool(clusterRpc.rpc, pool);
    },
    enabled,
    retry: 1,
  });

  if (!query.data)
    return {
      amount: 0,
      displayAmount: PARAM,
    };
  return {
    amount: microToUsd(query.data.data.totalAmount),
    displayAmount: usd(microToUsd(query.data.data.totalAmount)),
  };
}
