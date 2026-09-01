/**
 * The stone family — member-joins atom geometry.
 *
 * meta/primitives/atoms/member-joins.md: irregular hexagon, 6 vertices, no two
 * angles equal, no perfect symmetry, per-instance rotation ±15°. Never circles,
 * never squares, never tiled uniformly — no mortar.
 *
 * Deterministic per seed: a member's stone is the same stone in every scene it
 * appears in (join flow, refund, dissolution), which is what makes the pile
 * readable as *these* members.
 */

export type StoneSize = "S" | "M" | "L";

/** Size classes in px width: S = Basic, M = Standard, L = Premium. */
export const STONE_SIZES: Record<StoneSize, number> = {
  S: 40,
  M: 56,
  L: 80,
};

export interface Point {
  x: number;
  y: number;
}

/** Mulberry32 — tiny deterministic PRNG, enough entropy for vertex jitter. */
function rng(seed: number): () => number {
  let a = seed >>> 0;
  return () => {
    a |= 0;
    a = (a + 0x6d2b79f5) | 0;
    let t = Math.imul(a ^ (a >>> 15), 1 | a);
    t = (t + Math.imul(t ^ (t >>> 7), 61 | t)) ^ t;
    return ((t ^ (t >>> 14)) >>> 0) / 4294967296;
  };
}

/**
 * Six vertices around an ellipse whose radii jitter ±15% per axis and whose
 * angular spacing is uneven (each of the 6 spokes offset by up to ±10°), then
 * rounded to the 4px grid (composition.md: every coordinate lands on a
 * multiple of 4). Uneven spokes + jittered radii ⇒ six unequal angles, always.
 */
export function stonePoints(size: StoneSize, seed: number): Point[] {
  const w = STONE_SIZES[size];
  const h = w * 0.78; // stones are slightly wider than tall
  const rand = rng(seed * 2654435761);
  const spokes = Array.from({ length: 6 }, (_, i) => {
    const even = (i * Math.PI) / 3;
    const jitter = (rand() - 0.5) * (Math.PI / 9); // ±10°
    return even + jitter;
  });
  return spokes.map((angle) => {
    const rx = (w / 2) * (0.85 + rand() * 0.3); // ±15% radius jitter
    const ry = (h / 2) * (0.85 + rand() * 0.3);
    return {
      x: Math.round((rx * Math.cos(angle)) / 4) * 4,
      y: Math.round((ry * Math.sin(angle)) / 4) * 4,
    };
  });
}

/** Per-instance rotation within ±15° — neighbors never share an angle. */
export function stoneRotation(seed: number): number {
  const rand = rng(seed * 40503 + 1);
  return (rand() - 0.5) * 30;
}
