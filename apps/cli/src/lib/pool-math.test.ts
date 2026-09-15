import { describe, expect, it } from "vitest";

import { moneyWeightedPayout } from "./pool-math";

describe("moneyWeightedPayout — crank.rs payout() port", () => {
  it("computes the exact money-weighted share", () => {
    // crank.rs unit case: 1_000_000 × 100 / 400 = 250_000
    expect(moneyWeightedPayout(1_000_000n, 100n, 400n)).toBe(250_000n);
  });

  it("floors like the on-chain integer division", () => {
    expect(moneyWeightedPayout(1000n, 1n, 3n)).toBe(333n);
    expect(moneyWeightedPayout(9n, 2n, 3n)).toBe(6n);
  });

  it("pays zero for a zero depositor total", () => {
    expect(moneyWeightedPayout(1_000_000n, 0n, 400n)).toBe(0n);
  });

  it("returns 0 on a zero pool total (on-chain impossible with a depositor)", () => {
    expect(moneyWeightedPayout(1000n, 1n, 0n)).toBe(0n);
  });
});
