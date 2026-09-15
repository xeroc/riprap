import { Track } from "@riprap/pool";
import { describe, expect, it } from "vitest";

import { toBigInt, trackFromName } from "./pool-args";

describe("toBigInt", () => {
  it("parses decimal integers", () => {
    expect(toBigInt("amount", "1000", 64)).toBe(1000n);
    expect(toBigInt("rate", "340282366920938463463374607431768211455", 128)).toBe(
      340282366920938463463374607431768211455n,
    );
  });

  it("rejects non-integers, negatives, and out-of-range values", () => {
    expect(() => toBigInt("amount", "abc", 64)).toThrow(/amount must be an integer/);
    expect(() => toBigInt("amount", "1.5", 64)).toThrow(/amount must be an integer/);
    expect(() => toBigInt("amount", "-1", 64)).toThrow(/non-negative/);
    expect(() => toBigInt("seed", "18446744073709551616", 64)).toThrow(/does not fit u64/);
    expect(() => toBigInt("rate", "340282366920938463463374607431768211456", 128)).toThrow(
      /does not fit u128/,
    );
  });
});

describe("trackFromName", () => {
  it("maps the three track names to the SDK enum", () => {
    expect(trackFromName("ownership")).toBe(Track.Ownership);
    expect(trackFromName("rights")).toBe(Track.Rights);
    expect(trackFromName("yield")).toBe(Track.Yield);
  });

  it("rejects anything else", () => {
    expect(() => trackFromName("tranche")).toThrow(/Unknown track/);
  });
});
