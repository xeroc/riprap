import { describe, expect, it } from "vitest";
import { moneyY, steppedPath } from "./trace";

describe("moneyY", () => {
  it("maps the scale endpoints and stays linear between them", () => {
    expect(moneyY(0, 20000, 360, 240)).toBe(360);
    expect(moneyY(20000, 20000, 360, 240)).toBe(240);
    expect(moneyY(12000, 20000, 360, 240)).toBe(288); // 0.6 × 120px drop
  });

  it("clamps beyond the scale — the pool never draws negative", () => {
    expect(moneyY(999999, 20000, 360, 240)).toBe(240);
    expect(moneyY(-5, 20000, 360, 240)).toBe(360);
  });
});

describe("steppedPath", () => {
  it("strings corner points into a stepped polyline", () => {
    expect(
      steppedPath([
        { x: 40, y: 360 },
        { x: 172, y: 360 },
        { x: 172, y: 240 },
      ]),
    ).toBe("M 40 360 L 172 360 L 172 240");
  });
});
