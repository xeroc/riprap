// The claim-flow registry: every `claimFlow` id the directory names resolves
// to a registered pack whose own id matches — a listing pointing at a
// missing pack would silently hide its file action (the pinned case).
import { describe, expect, it } from "vitest";
import { MUTUALS } from "../../../mutuals/data";
import { BLADE_POOL_FLOW } from "./blade-pool";
import { claimFlowFor } from "./index";

describe("claimFlowFor (the data.ts → pack connection)", () => {
  it("every listing that names a claimFlow resolves to a registered pack with a matching id", () => {
    const named = MUTUALS.filter((m) => m.claimFlow !== undefined);
    expect(named.length).toBeGreaterThan(0);
    for (const listing of named) {
      const flow = claimFlowFor(listing);
      expect(flow, `no pack registered for ${listing.slug}'s claimFlow`).not.toBeNull();
      expect(flow?.id).toBe(listing.claimFlow);
    }
  });

  it("both Blade Pool listings (devnet + mainnet pins) resolve to the blade pack", () => {
    for (const slug of ["blade-pool-devnet", "blade-pool"]) {
      const listing = MUTUALS.find((m) => m.slug === slug);
      expect(claimFlowFor(listing)).toBe(BLADE_POOL_FLOW);
    }
  });

  it("a listing without a claimFlow, or an unknown pool, resolves to null", () => {
    expect(claimFlowFor(MUTUALS.find((m) => m.slug === "chairmageddon"))).toBeNull();
    expect(claimFlowFor(undefined)).toBeNull();
  });
});
