// usePoolDef — one pool's anchored-def resolution, the shared read behind
// every def-driven surface (epic riprap-hs4r): the on-chain Mutual account →
// its seed + policyHash → the derived domain_ref → the evidence daemon's CAS
// GET → riprap-def/v1 parse. Every refusal is an honest state, never a
// fallback: 404 is "not published yet", unparseable bytes are "not a def".
// The chain read and the CAS read share react-query caches with every other
// consumer of the same address/doc (usePool / usePolicyDoc keys).
import type { Mutual } from "@riprap/hanse";
import type { Address } from "@solana/kit";
import { useMemo } from "react";
import { type PolicyDocQuery, usePolicyDoc } from "../../pool/usePolicyDoc";
import { type PoolQuery, usePool } from "../../pool/usePool";
import { parseDefDoc, type RiprapDef } from "./schema";

export type PoolDefResolution =
  | { state: "pool-loading" }
  | { state: "pool-error"; retry: () => void }
  | { state: "not-found" } // no address / no mutual on this cluster
  | { state: "doc-loading" }
  | { state: "doc-error"; retry: () => void }
  | { state: "missing" } // CAS 404 — the def isn't published
  | { state: "not-a-def" } // the anchored bytes aren't a riprap-def/v1 doc
  | {
      state: "ready";
      def: RiprapDef;
      mutual: Mutual;
      mutualQuery: PoolQuery;
      docQuery: PolicyDocQuery;
    };

export function usePoolDef(address: Address | null): PoolDefResolution {
  const mutualQuery = usePool(address);
  const mutual = mutualQuery.state === "ready" ? mutualQuery.mutual : null;
  const docQuery = usePolicyDoc(mutual);
  const def = useMemo(
    () => (docQuery.state === "ready" ? parseDefDoc(docQuery.text) : null),
    [docQuery],
  );

  if (address === null || mutualQuery.state === "not-found") return { state: "not-found" };
  if (mutualQuery.state === "loading") return { state: "pool-loading" };
  if (mutualQuery.state === "error") return { state: "pool-error", retry: mutualQuery.retry };
  if (docQuery.state === "idle" || docQuery.state === "loading") return { state: "doc-loading" };
  if (docQuery.state === "error") return { state: "doc-error", retry: docQuery.retry };
  if (docQuery.state === "missing") return { state: "missing" };
  if (def === null) return { state: "not-a-def" };
  return { state: "ready", def, mutual: mutualQuery.mutual, mutualQuery, docQuery };
}
