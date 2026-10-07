// The claim-flow registry — resolves a directory listing's `claimFlow`
// field (mutuals/data.ts) to its filing pack. Add a pool: a pack file under
// ./flows + one line here + the `claimFlow` field on its data.ts entry.
import type { MutualListing } from "../../../mutuals/types";
import type { ClaimFlow } from "../flow";
import { BLADE_POOL_FLOW } from "./blade-pool";

const FLOWS: Record<string, ClaimFlow> = {
  [BLADE_POOL_FLOW.id]: BLADE_POOL_FLOW,
};

/** The listing's filing pack — null when the pool names none or names an
 *  unregistered one (surfaces hide their file action; the index test pins
 *  every listed flow id to a registered pack). */
export function claimFlowFor(listing: MutualListing | undefined): ClaimFlow | null {
  if (listing === undefined || listing.claimFlow === undefined) return null;
  return FLOWS[listing.claimFlow] ?? null;
}
