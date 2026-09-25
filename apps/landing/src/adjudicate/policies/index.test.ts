// Policy selection (riprap-gtni, spec §7): the pack follows the mutual the
// per-cluster map resolves. v1 is single-tenant — every mapped mutual is the
// Blade Pool. The keyed-registry / anchored-fetch swap is the seam recorded
// in bean riprap-h6wp; this pins the v1 behavior so that swap is deliberate.

import type { Address } from "@solana/kit";
import { describe, expect, it } from "vitest";
import { BLADE_POOL_POLICY } from "./blade-pool";
import { adjudicationPolicyFor } from "./index";

describe("adjudicationPolicyFor (spec §7: selection via the per-cluster mutual map)", () => {
  it("v1 single-tenant: any mapped mutual resolves to the Blade Pool pack", () => {
    // Unchecked cast — a base58-shaped stand-in; the selector never reads it in v1.
    const mutual = "Mutua1Poo1xxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx" as Address;
    expect(adjudicationPolicyFor(mutual)).toBe(BLADE_POOL_POLICY);
  });
});
