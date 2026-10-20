// The adjudication-pack registry — resolves a pool's policy pack: a
// directory listing's `adjudicationPolicy` field (pools/data.ts) to its
// hand-written pack, or — for def-driven community pools — the pool's
// anchored riprap-def/v1 doc to a built pack (pools/def/packs.ts; epic
// riprap-hs4r) (ADJUDICATION-DASHBOARD §7). Add a first-party pool: a pack
// file under ./policies + one line here + the `adjudicationPolicy` field on
// its data.ts entry. Community pools never touch this table.

import { buildAdjudicationPolicy } from "../../pools/def/packs";
import type { RiprapDef } from "../../pools/def/schema";
import type { PoolListing } from "../../pools/types";
import type { AdjudicationPolicy } from "../policy";
import { BLADE_POOL_POLICY } from "./blade-pool";

const POLICIES: Record<string, AdjudicationPolicy> = {
  [BLADE_POOL_POLICY.id]: BLADE_POOL_POLICY,
};

/** The pool's adjudication pack — def-driven pools build theirs from the
 *  anchored doc (never this table); first-party pools resolve their
 *  `adjudicationPolicy` id, and null means no pack (the session renders its
 *  no-policy honest state; the index test pins every listed id to a
 *  registered pack). */
export function adjudicationPolicyFor(
  listing: PoolListing | undefined,
  def?: RiprapDef,
): AdjudicationPolicy | null {
  if (def !== undefined) return buildAdjudicationPolicy(def);
  if (listing === undefined || listing.adjudicationPolicy === undefined) return null;
  return POLICIES[listing.adjudicationPolicy] ?? null;
}
