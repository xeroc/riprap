import { motion, useReducedMotion } from "motion/react";

/*
 * HexBackdrop — the hero's engineering paper: a hexagonal Voronoi lattice
 * (the Voronoi diagram of a triangular lattice = honeycomb) in faint 1px
 * hairlines, and a slow ambient breath.
 *
 * Depth is tone only — no gradients, no glow, no new hues. A cell either
 * breathes or does nothing; a breather never exceeds --riprap-surface-strong
 * (the "emphasized" ceiling).
 *
 * Two layers:
 *  1. lattice    — static from first paint, faint (hairline-soft), edge
 *                  bands recede one tone step.
 *  2. breathers  — a sparse seeded set fading in and out on desynchronized
 *                  5–10s mirrored cycles. Each starts at a random phase
 *                  (negative delay), so from t=0 some cells are mid-fade-out.
 *                  User-sanctioned exception to the no-loops motion law;
 *                  reduced motion renders them as static mid-tone cells.
 */

/** flat-top hexagon outline at (cx, cy), circumradius r */
function hexPath(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i);
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)} ${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return `M${pts.join("L")}Z`;
}

/** hex corners as a point list (for per-cell filled polygons) */
function hexPoints(cx: number, cy: number, r: number): string {
  const pts: string[] = [];
  for (let i = 0; i < 6; i++) {
    const a = (Math.PI / 180) * (60 * i);
    pts.push(`${(cx + r * Math.cos(a)).toFixed(1)},${(cy + r * Math.sin(a)).toFixed(1)}`);
  }
  return pts.join(" ");
}

/** deterministic per-cell hash (salted) — no hydration drift */
function cellHash(i: number, j: number, salt: number): number {
  const h = Math.sin(i * 127.1 + j * 311.7 + salt * 74.7) * 43758.5453;
  return h - Math.floor(h);
}

export interface HexBackdropProps {
  className?: string;
  /** lattice drawing field (viewBox); slice-covers whatever it is placed in */
  width?: number;
  height?: number;
  /** hex circumradius in viewBox units */
  radius?: number;
  /** fraction of cells that breathe in/out on slow desynchronized cycles */
  breatheDensity?: number;
  /** radial assembly origin in viewBox units — where the ring lands */
  anchorX?: number;
  anchorY?: number;
}

export function HexBackdrop({
  className,
  width = 1280,
  height = 720,
  radius = 26,
  breatheDensity = 0.05,
  anchorX = width * 0.78,
  anchorY = height * 0.6,
}: HexBackdropProps) {
  const reduced = useReducedMotion();

  const dx = Math.sqrt(3) * radius; // column pitch (flat-top)
  const dy = 1.5 * radius; // row pitch
  const cols = Math.ceil(width / dx) + 2;
  const rows = Math.ceil(height / dy) + 2;

  /** band = radial distance from the anchor, in row-pitch units */
  const bandOf = (x: number, y: number) => Math.round(Math.hypot(x - anchorX, y - anchorY) / dy);

  // static lattice, grouped by band only so edge bands can recede (tone step)
  const bands = new Map<number, string[]>();
  // breathers fade in/out forever on desynchronized slow cycles
  const breathers: {
    id: string;
    points: string;
    duration: number;
    phase: number;
    floor: number;
  }[] = [];

  for (let j = -1; j < rows; j++) {
    for (let i = -1; i < cols; i++) {
      const cx = i * dx + (j % 2 === 0 ? 0 : dx / 2);
      const cy = j * dy;
      const b = bandOf(cx, cy);

      let outline = bands.get(b);
      if (!outline) {
        outline = [];
        bands.set(b, outline);
      }
      outline.push(hexPath(cx, cy, radius));

      const id = `${i}-${j}`;
      const hb = cellHash(i, j, 2);

      if (hb < breatheDensity) {
        // 5–10s mirrored cycle, negative delay = random phase at t=0
        // (some cells caught mid-fade-out from the first frame), small floor
        // so a cell never fully pops out of existence
        breathers.push({
          id,
          points: hexPoints(cx, cy, radius - 1),
          duration: 5 + cellHash(i, j, 3) * 5,
          phase: cellHash(i, j, 4) * 10,
          floor: 0.08,
        });
      }
    }
  }

  return (
    <svg
      viewBox={`0 0 ${width} ${height}`}
      preserveAspectRatio="xMidYMid slice"
      aria-hidden="true"
      data-slot="hex-backdrop"
      className={className}
    >
      {/* 1 — the lattice: faint, static from first paint; edges recede a step */}
      {[...bands.entries()]
        .sort(([a], [b]) => a - b)
        .map(([b, outline]) => (
          <path
            key={b}
            d={outline.join("")}
            fill="none"
            stroke="var(--riprap-hairline-soft)"
            strokeWidth={1}
            opacity={0.3}
          />
        ))}
      {/* 2 — breathers: slow in/out, desynchronized from a random phase;
             static mid-tone when reduced motion is preferred (loops collapse) */}
      {breathers.map((c) => (
        <motion.polygon
          key={c.id}
          data-breathe="true"
          points={c.points}
          fill="var(--riprap-surface-strong)"
          initial={reduced ? { opacity: 0.5 } : { opacity: c.floor }}
          animate={reduced ? { opacity: 0.5 } : { opacity: [c.floor, 1, c.floor] }}
          transition={
            reduced
              ? { duration: 0 }
              : {
                  duration: c.duration,
                  delay: -c.phase,
                  repeat: Infinity,
                  repeatType: "loop",
                  ease: "easeInOut",
                }
          }
        />
      ))}
    </svg>
  );
}
