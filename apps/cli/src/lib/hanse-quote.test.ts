import { describe, expect, test } from "vitest";

import { quotePayout, settlementRatio } from "./hanse-quote";

/**
 * Base units = 6-dec USDC. §8 prose rounds to cents/dimes; these tests pin
 * the EXACT integer math (two-stage flooring: ratio floored at settle_pool,
 * each payout term floored at claim_payout).
 */
const CLAIM = 2_000_000_000n; // $2,000
const FEE = 15_000_000n; // $15 = 3 × $5 (§12)
const TREASURY = 20_000_000_000n; // 1,000 × $20 Standard

describe("settlementRatio — settle_pool.rs §2.5", () => {
  test("§8 solvent: 4 × (2000 + 15) owed vs 20,000 → ratio 1.0", () => {
    const obligations = 4n * CLAIM;
    const feeRefunds = 4n * FEE;
    expect(settlementRatio(TREASURY, obligations, feeRefunds)).toBe(1_000_000_000n);
  });
  test("§8 exhausted: 15 × (2000 + 15) owed vs 20,000 → ratio 661,703,887 (≈0.6617)", () => {
    expect(settlementRatio(TREASURY, 15n * CLAIM, 15n * FEE)).toBe(661_703_887n);
  });

  test("nothing owed ⇒ ratio 1e9 (everything is residual)", () => {
    expect(settlementRatio(TREASURY, 0n, 0n)).toBe(1_000_000_000n);
  });

  test("over-funded ⇒ capped at 1e9", () => {
    expect(settlementRatio(TREASURY * 2n, CLAIM, FEE)).toBe(1_000_000_000n);
  });
});

describe("quotePayout — claim_payout.rs §7/§8", () => {
  test("§8 solvent: payout = 2,000 + 15 = 2,015; burn saturates at the $20 contribution", () => {
    const quote = quotePayout({
      claimAmount: CLAIM,
      feePaid: FEE,
      ratio1e9: 1_000_000_000n,
      contribution: 20_000_000n,
    });
    expect(quote.claimPart).toBe(2_000_000_000n);
    expect(quote.feePart).toBe(15_000_000n);
    expect(quote.payout).toBe(2_015_000_000n);
    expect(quote.burn).toBe(20_000_000n); // payout ≫ contribution
  });

  test("§8 exhausted: 1,323.41 + 9.93 (exact base units; §8 prose rounds to $1,323.40 + $9.93)", () => {
    const ratio = settlementRatio(TREASURY, 15n * CLAIM, 15n * FEE);
    const quote = quotePayout({
      claimAmount: CLAIM,
      feePaid: FEE,
      ratio1e9: ratio,
      contribution: 20_000_000n,
    });
    expect(quote.claimPart).toBe(1_323_407_774n); // $1,323.407774 — §8 "$1,323.40"
    expect(quote.feePart).toBe(9_925_558n); // $9.925558 — §8 "$9.93"
    expect(quote.payout).toBe(1_333_333_332n);
    expect(quote.burn).toBe(20_000_000n);
  });

  test("each term floors independently (on-chain integer division)", () => {
    const quote = quotePayout({ claimAmount: 1n, feePaid: 1n, ratio1e9: 500_000_000n });
    expect(quote.claimPart).toBe(0n);
    expect(quote.feePart).toBe(0n);
    expect(quote.payout).toBe(0n);
  });

  test("burn below the contribution burns the payout exactly", () => {
    const quote = quotePayout({
      claimAmount: 100n,
      feePaid: 0n,
      ratio1e9: 1_000_000_000n,
      contribution: 1_000n,
    });
    expect(quote.burn).toBe(100n);
  });

  test("no contribution given ⇒ burn undefined", () => {
    expect(quotePayout({ claimAmount: 100n, feePaid: 0n, ratio1e9: 1n }).burn).toBeUndefined();
  });
});
