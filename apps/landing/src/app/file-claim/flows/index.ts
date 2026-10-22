// The claim-flow registry — resolves a pool's filing pack: a directory
// listing's `claimFlow` field (pools/data.ts) to its hand-written pack, or
// — for def-driven community pools — the pool's anchored riprap-def/v1 doc to
// a built pack (pools/def/packs.ts; epic riprap-hs4r). Add a first-party
// pool: a pack file under ./flows + one line here + the `claimFlow` field on
// its data.ts entry. Community pools never touch this table.
import { buildClaimFlow } from "../../../pools/def/packs";
import type { RiprapDef } from "../../../pools/def/schema";
import type { PoolListing } from "../../../pools/types";
import type { ClaimFlow } from "../flow";
import { BLADE_POOL_FLOW } from "./blade-pool";
import { TOLY_FUEL_FLOW } from "./toly-needs-his-fuel";

const FLOWS: Record<string, ClaimFlow> = {
  [BLADE_POOL_FLOW.id]: BLADE_POOL_FLOW,
  [TOLY_FUEL_FLOW.id]: TOLY_FUEL_FLOW,
};

/** The pool's filing pack — def-driven pools build theirs from the anchored
 *  doc (never this table); first-party pools resolve their `claimFlow` id,
 *  and null means no pack (surfaces hide their file action; the index test
 *  pins every listed flow id to a registered pack). */
export function claimFlowFor(listing: PoolListing | undefined, def?: RiprapDef): ClaimFlow | null {
  if (def !== undefined) return buildClaimFlow(def);
  if (listing === undefined || listing.claimFlow === undefined) return null;
  return FLOWS[listing.claimFlow] ?? null;
}
