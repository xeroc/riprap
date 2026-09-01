import { describe, expect, it } from "vitest";
import { STONE_SIZES, type StoneSize, stonePoints, stoneRotation } from "./stone";

const SIZES = Object.keys(STONE_SIZES) as StoneSize[];

describe("stonePoints (member-joins atom — irregular hexagon, no mortar)", () => {
  it("returns 6 vertices for every size class and seed", () => {
    for (const size of SIZES) {
      expect(stonePoints(size, 1)).toHaveLength(6);
      expect(stonePoints(size, 999)).toHaveLength(6);
    }
  });

  it("is deterministic per seed — the same stone renders identically everywhere", () => {
    expect(stonePoints("M", 42)).toEqual(stonePoints("M", 42));
  });

  it("differs between seeds — piles must look piled, not tiled", () => {
    const a = JSON.stringify(stonePoints("M", 1));
    const b = JSON.stringify(stonePoints("M", 2));
    expect(a).not.toEqual(b);
  });

  it("fits the size class width (±20% jitter around the nominal width)", () => {
    for (const size of SIZES) {
      const pts = stonePoints(size, 7);
      const xs = pts.map((p) => p.x);
      const width = Math.max(...xs) - Math.min(...xs);
      const nominal = STONE_SIZES[size];
      expect(width).toBeGreaterThan(nominal * 0.7);
      expect(width).toBeLessThanOrEqual(nominal * 1.2);
    }
  });

  it("produces unequal angles — no perfect symmetry, ever", () => {
    const pts = stonePoints("L", 3);
    const angles: number[] = [];
    for (let i = 0; i < 6; i++) {
      const prev = pts[(i + 5) % 6];
      const cur = pts[i];
      const next = pts[(i + 1) % 6];
      const a1 = Math.atan2(prev.y - cur.y, prev.x - cur.x);
      const a2 = Math.atan2(next.y - cur.y, next.x - cur.x);
      let delta = Math.abs(a2 - a1);
      if (delta > Math.PI) delta = 2 * Math.PI - delta;
      angles.push(delta);
    }
    const uniq = new Set(angles.map((a) => a.toFixed(4)));
    expect(uniq.size).toBe(6); // all six angles distinct
  });
});

describe("stoneRotation", () => {
  it("stays within ±15° (composition.md stone family)", () => {
    for (let seed = 0; seed < 50; seed++) {
      const r = stoneRotation(seed);
      expect(Math.abs(r)).toBeLessThanOrEqual(15);
    }
  });

  it("varies between seeds", () => {
    const rotations = new Set(Array.from({ length: 20 }, (_, i) => stoneRotation(i).toFixed(2)));
    expect(rotations.size).toBeGreaterThan(10);
  });
});
