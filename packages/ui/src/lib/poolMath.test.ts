import { describe, expect, it } from "vitest";
import {
  fillHeight,
  proRataShare,
  scaledPayout,
  TIERS,
  type TierName,
  tierFor,
  usd,
} from "./poolMath";

describe("TIERS (policy doc §5 — the only allowed prices)", () => {
  it("has exactly the three policy tiers", () => {
    expect(TIERS.map((t) => [t.name, t.fee, t.cap])).toEqual([
      ["Basic", 10, 1000],
      ["Standard", 20, 2000],
      ["Premium", 40, 4000],
    ]);
  });

  it("holds the 1:100 fee-to-cap ratio on every tier", () => {
    for (const t of TIERS) expect(t.cap / t.fee).toBe(100);
  });

  it("resolves a tier by name", () => {
    expect(tierFor("Standard").fee).toBe(20);
    expect(() => tierFor("Gold" as TierName)).toThrow();
  });
});

describe("proRataShare (policy §7 — remainder returns pro-rata)", () => {
  it("worked example: $12,000 across 1,000 equal stakes = $12 each", () => {
    expect(proRataShare(12000, 20, 20000)).toBeCloseTo(12, 10);
  });

  it("heavier-storm variant: $8,000 across 1,000 equal stakes = $8 each", () => {
    expect(proRataShare(8000, 20, 20000)).toBeCloseTo(8, 10);
  });

  it("is linear in the member's own stake", () => {
    expect(proRataShare(12000, 40, 20000)).toBeCloseTo(24, 10);
  });
  it("returns 0 for an empty treasury", () => {
    expect(proRataShare(0, 20, 20000)).toBe(0);
  });
});

describe("scaledPayout (policy §7 — the mutual never pays more than it holds)", () => {
  it("pays claims in full when approvals fit the pool", () => {
    expect(scaledPayout(2000, 8000, 20000)).toBe(2000);
  });

  it("scales every payout down by P/A when approvals exceed the pool", () => {
    // data-stories story 3: 12 claims at the $2,000 Standard cap, A = $24,000, P = $20,000
    expect(scaledPayout(2000, 24000, 20000)).toBeCloseTo(1666.67, 2);
  });

  it("caps at the tier cap first, then scales (payout = min(cap, amount) × P/A)", () => {
    // claimant asks $5,000 on a Standard tier: cap binds at $2,000, then × 20/24
    expect(scaledPayout(5000, 24000, 20000, 2000)).toBeCloseTo(1666.67, 2);
  });

  it("never exceeds the pool, even for a single full-pool claim", () => {
    expect(scaledPayout(2000, 40000, 20000)).toBe(1000);
  });
});

describe("fillHeight (composition.md § scale discipline — area = money)", () => {
  it("maps the max balance to the max fill height", () => {
    expect(fillHeight(20000, 20000, 208)).toBe(208);
  });

  it("maps zero to zero", () => {
    expect(fillHeight(0, 20000, 208)).toBe(0);
  });

  it("is linear in between", () => {
    expect(fillHeight(12000, 20000, 208)).toBeCloseTo(124.8, 6);
  });

  it("clamps above max (never overflows the rim)", () => {
    expect(fillHeight(30000, 20000, 208)).toBe(208);
  });
});

describe("usd", () => {
  it("prints whole dollars without cents", () => {
    expect(usd(20000)).toBe("$20,000");
    expect(usd(12)).toBe("$12");
  });

  it("keeps cents only when they matter", () => {
    expect(usd(1666.67)).toBe("$1,666.67");
  });
});
