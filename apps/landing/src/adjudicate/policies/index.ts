// The adjudication-pack registry — resolves a directory listing's
// `adjudicationPolicy` field (mutuals/data.ts) to its policy pack
// (ADJUDICATION-DASHBOARD §7). Add a pool: a pack file under ./policies + one
// line here + the `adjudicationPolicy` field on its data.ts entry — the claim
// wizard's `claimFlow` pattern. When a second policy appears the anchored
// domain-CAS fetch can replace this table behind the same interface
// (bean riprap-h6wp) — an engine no-op.

import type { MutualListing } from "../../mutuals/types";
import type { AdjudicationPolicy } from "../policy";
import { BLADE_POOL_POLICY } from "./blade-pool";

const POLICIES: Record<string, AdjudicationPolicy> = {
  [BLADE_POOL_POLICY.id]: BLADE_POOL_POLICY,
};

/** The listing's adjudication pack — null when the pool names none or names
 * an unregistered one (the session renders its no-policy honest state; the
 * index test pins every listed id to a registered pack). */
export function adjudicationPolicyFor(
  listing: MutualListing | undefined,
): AdjudicationPolicy | null {
  if (listing === undefined || listing.adjudicationPolicy === undefined) return null;
  return POLICIES[listing.adjudicationPolicy] ?? null;
}
