// The adjudication-pack registry: every `adjudicationPolicy` id the directory
// names resolves to a registered pack whose own id matches — a listing
// pointing at a missing pack would silently dead-end its jury sessions (the
// pinned case).

import { describe, expect, it } from "vitest";
import { MUTUALS } from "../../mutuals/data";
import { BLADE_POOL_POLICY } from "./blade-pool";
import { adjudicationPolicyFor } from "./index";

describe("adjudicationPolicyFor (the data.ts → pack connection)", () => {
  it("every listing that names an adjudicationPolicy resolves to a registered pack with a matching id", () => {
    const named = MUTUALS.filter((m) => m.adjudicationPolicy !== undefined);
    expect(named.length).toBeGreaterThan(0);
    for (const listing of named) {
      const policy = adjudicationPolicyFor(listing);
      expect(policy, `no pack registered for ${listing.slug}'s adjudicationPolicy`).not.toBeNull();
      expect(policy?.id).toBe(listing.adjudicationPolicy);
    }
  });

  it("both Blade Pool listings (devnet + mainnet pins) resolve to the blade pack", () => {
    for (const pin of [
      "BXGcC19c43fzU3JyowyJrTVQ7gahtGR9o2Ca1JKSGKbe",
      "DtjVEhcrESkED2Mc57smYE5doGxRSi4TK3bP2zqGEccF",
    ]) {
      const listing = MUTUALS.find((m) => m.pubkey === pin);
      expect(adjudicationPolicyFor(listing)).toBe(BLADE_POOL_POLICY);
    }
  });

  it("a listing without an adjudicationPolicy, or an unknown pool, resolves to null", () => {
    expect(adjudicationPolicyFor(MUTUALS.find((m) => m.slug === "chairmageddon"))).toBeNull();
    expect(adjudicationPolicyFor(undefined)).toBeNull();
  });
});
