import { describe, expect, it } from "vitest";

import { cubicBezier, easeInOut, SETTLE, SETTLE_EASE, STAGGER, settleAt } from "./settle";

/*
 * Source of truth: Glyph.tsx motion constants + tokens.css --riprap-settle
 * (DESIGN.md § Motion: settle, not slide — 160ms ease-out quart, 40ms stagger).
 * The frame-clock path must reproduce the wall-clock curve exactly, so these
 * tests pin the numbers the video renderer depends on.
 */

describe("settle constants (DESIGN.md § Motion)", () => {
  it("160ms settle, 40ms stagger", () => {
    expect(SETTLE).toBe(0.16);
    expect(STAGGER).toBe(0.04);
  });

  it("the ease is the tokens.css --riprap-settle curve", () => {
    expect(SETTLE_EASE).toEqual([0.215, 0.61, 0.355, 1]);
  });
});

describe("cubicBezier", () => {
  it("hits the endpoints exactly", () => {
    const f = cubicBezier(...SETTLE_EASE);
    expect(f(0)).toBeCloseTo(0, 10);
    expect(f(1)).toBeCloseTo(1, 10);
  });

  it("is monotonic non-decreasing for the settle curve", () => {
    const f = cubicBezier(...SETTLE_EASE);
    let prev = -Infinity;
    for (let i = 0; i <= 100; i++) {
      const y = f(i / 100);
      expect(y).toBeGreaterThanOrEqual(prev);
      prev = y;
    }
  });

  it("is an ease-OUT curve — fast start, gentle stop", () => {
    const f = cubicBezier(...SETTLE_EASE);
    expect(f(0.5)).toBeGreaterThan(0.7); // halfway in, most of the way out
    expect(f(0.25)).toBeGreaterThan(0.5);
  });
});

describe("settleAt — eased arrival progress", () => {
  it("is 0 at and before the delay, 1 at delay+duration", () => {
    expect(settleAt(-1)).toBe(0);
    expect(settleAt(0)).toBe(0);
    expect(settleAt(0.1, 0.5)).toBe(0);
    expect(settleAt(SETTLE)).toBe(1);
    expect(settleAt(10)).toBe(1);
    expect(settleAt(0.66, 0.5, SETTLE)).toBe(1);
  });

  it("delay shifts the window without reshaping the curve", () => {
    expect(settleAt(0.6, 0.5, SETTLE)).toBeCloseTo(settleAt(0.1, 0, SETTLE), 12);
  });

  it("matches the bezier evaluated on the normalized progress", () => {
    const f = cubicBezier(...SETTLE_EASE);
    for (const t of [0.02, 0.05, 0.08, 0.12, 0.15]) {
      expect(settleAt(t)).toBeCloseTo(f(t / SETTLE), 12);
    }
  });

  it("clamps overshoot inputs for arbitrary durations", () => {
    expect(settleAt(3, 0, 2)).toBe(1);
    expect(settleAt(0, 0, 2)).toBe(0);
    expect(settleAt(1, 0, 2)).toBeCloseTo(cubicBezier(...SETTLE_EASE)(0.5), 12);
  });
});

describe("easeInOut — mirrored ambient cycles (HexBackdrop breathers)", () => {
  it("runs 0 → 1 → 0 across the full cycle", () => {
    expect(easeInOut(0)).toBe(0);
    expect(easeInOut(0.5)).toBeCloseTo(1, 12);
    expect(easeInOut(1)).toBe(0);
  });

  it("is symmetric around the midpoint", () => {
    for (const f of [0.1, 0.25, 0.4]) {
      expect(easeInOut(f)).toBeCloseTo(easeInOut(1 - f), 12);
    }
  });
});
