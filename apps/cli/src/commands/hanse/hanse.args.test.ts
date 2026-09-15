import { describe, expect, test } from "vitest";

import {
  hexToBytes32,
  juryFee,
  parseSubaccordParam,
  parseTierSpec,
  tierIndexFromName,
} from "../../lib/hanse-args";

describe("tierIndexFromName (hanse:join)", () => {
  test("basic/standard/premium map to Mutual.tiers slots 0/1/2 (EVENT-MUTUAL §6)", () => {
    expect(tierIndexFromName("basic")).toBe(0);
    expect(tierIndexFromName("standard")).toBe(1);
    expect(tierIndexFromName("premium")).toBe(2);
  });

  test("unknown tier errors", () => {
    expect(() => tierIndexFromName("gold")).toThrow(/expected basic, standard, or premium/i);
  });
});

describe("parseTierSpec (hanse:initialize)", () => {
  test("parses contribution:max-payout u64:u64", () => {
    expect(parseTierSpec("10000000:1000000000")).toEqual({
      contribution: 10_000_000n,
      maxPayout: 1_000_000_000n,
    });
  });

  test("pilot tiers round-trip (§12: Basic 10/1000 · Standard 20/2000 · Premium 40/4000)", () => {
    expect(parseTierSpec("10000000:1000000000").maxPayout).toBe(1_000_000_000n);
    expect(parseTierSpec("20000000:2000000000").maxPayout).toBe(2_000_000_000n);
    expect(parseTierSpec("40000000:4000000000").maxPayout).toBe(4_000_000_000n);
  });

  test.each([
    ["1000", "missing separator"],
    ["1:2:3", "too many segments"],
    ["-1:1000", "negative contribution"],
    ["1:abc", "non-numeric payout"],
    ["1:18446744073709551616", "payout over u64"],
  ])("rejects %s (%s)", (raw) => {
    expect(() => parseTierSpec(raw)).toThrow();
  });
});

describe("hexToBytes32", () => {
  test("64 hex chars → 32 bytes", () => {
    const raw = "ab".repeat(32);
    expect(hexToBytes32("policy-hash", raw)).toEqual(new Uint8Array(32).fill(0xab));
  });

  test("wrong length or charset errors", () => {
    expect(() => hexToBytes32("evidence", "zz".repeat(32))).toThrow(/64 hex chars/);
    expect(() => hexToBytes32("evidence", "ab".repeat(31))).toThrow(/64 hex chars/);
  });
});

describe("juryFee (§2.6)", () => {
  test("pilot: 3 jurors × 5 USDC = 15 USDC (§12)", () => {
    expect(juryFee(3, 5_000_000n)).toBe(15_000_000n);
  });

  test("single-juror pool: 1 × fee", () => {
    expect(juryFee(1, 2_000_000n)).toBe(2_000_000n);
  });

  test("u64 overflow errors", () => {
    expect(() => juryFee(3, (1n << 64n) / 3n + 1n)).toThrow(/overflows u64/);
  });

  test("non-positive jury size errors", () => {
    expect(() => juryFee(0, 1n)).toThrow(/positive integer/);
  });
});

describe("parseSubaccordParam (hanse:set-subaccord-param)", () => {
  test("u64 kinds parse to bigint fields", () => {
    expect(parseSubaccordParam("MinStake:2000")).toEqual({ __kind: "MinStake", fields: [2000n] });
    expect(parseSubaccordParam("FeePerJuror:5000000")).toEqual({
      __kind: "FeePerJuror",
      fields: [5_000_000n],
    });
    expect(parseSubaccordParam("ReviewWindow:86400")).toEqual({
      __kind: "ReviewWindow",
      fields: [86_400n],
    });
    expect(parseSubaccordParam("CommitWindow:43200")).toEqual({
      __kind: "CommitWindow",
      fields: [43_200n],
    });
    expect(parseSubaccordParam("RevealWindow:43200")).toEqual({
      __kind: "RevealWindow",
      fields: [43_200n],
    });
    expect(parseSubaccordParam("AppealWindow:172800")).toEqual({
      __kind: "AppealWindow",
      fields: [172_800n],
    });
  });

  test("AlphaBps parses to a u16 number field", () => {
    expect(parseSubaccordParam("AlphaBps:1500")).toEqual({ __kind: "AlphaBps", fields: [1500] });
  });

  test("deliberately unexposed kinds are rejected (set_subaccord_param.rs)", () => {
    for (const kind of [
      "MaxAppeals",
      "RevealThresholdBps",
      "MaxDrawAttempts",
      "Authority",
      "EvidenceOperator",
    ]) {
      expect(() => parseSubaccordParam(`${kind}:1`)).toThrow(/unknown payload kind/i);
    }
  });

  test.each([
    ["MinStake", "missing separator"],
    ["MinStake:-1", "negative"],
    ["MinStake:18446744073709551616", "over u64"],
    ["AlphaBps:65536", "over u16"],
  ])("rejects %s (%s)", (raw) => {
    expect(() => parseSubaccordParam(raw)).toThrow();
  });
});
