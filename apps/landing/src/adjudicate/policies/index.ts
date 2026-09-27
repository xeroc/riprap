// Policy selection (ADJUDICATION-DASHBOARD §7): the pack follows the mutual
// the per-cluster map resolves (src/pool/mutual.ts — one mutual per cluster,
// no picker). v1 ships exactly one deployment, so every mapped mutual is the
// Blade Pool and gets this pack. When a second policy appears this becomes a
// keyed registry / anchored domain-CAS fetch behind the same interface
// (bean riprap-h6wp) — an engine no-op.

import type { Address } from "@solana/kit";
import type { AdjudicationPolicy } from "../policy";
import { BLADE_POOL_POLICY } from "./blade-pool";

export function adjudicationPolicyFor(_mutual: Address): AdjudicationPolicy {
  // ponytail: single-tenant — one pack for every mapped mutual; a keyed
  // registry arrives with the anchored-fetch seam (bean riprap-h6wp).
  return BLADE_POOL_POLICY;
}
