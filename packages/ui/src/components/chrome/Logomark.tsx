import { motion, useReducedMotion } from "motion/react";
import { SETTLE, SETTLE_EASE, STAGGER } from "../../illustrations/Glyph";
import { type Point, stonePoints, stoneRotation } from "../../lib/stone";

/**
 * The Riprap logomark — THE RING.
 *
 * An open ring of stones around a protected middle: members face the storm
 * together; what's inside is protected. Exactly one slot is EMPTY (open
 * membership — someone is always arriving), exactly one stone is harbor-blue
 * (the newest member, settled last). Grey stones use the same seeded
 * irregular-hexagon family as every diagram — no mortar, no perfect circle.
 *
 * Brand law (DESIGN.md): the mark settles or dissolves; it never floats,
 * spins, or glows. Accent = var(--riprap-accent), stones = var(--riprap-stone).
 */

export interface LogomarkProps {
  /** rendered edge length in px (square). Default 96. */
  size?: number;
  /** state of the mark */
  state?: "settled" | "assemble" | "dissolve";
}

/** 8 slots clockwise from 12 o'clock. Fixed seeds — the mark is stable, and
 * asset generation (favicon) reuses them so files and components cannot drift. */
const SLOTS = 8;
export const RING_SEEDS = [3, 11, 27, 5, 19, 8, 13, 14] as const;
const SEEDS = RING_SEEDS;
/** empty slot: lower-right (~4:30) — the open door. */
export const GAP_INDEX = 3;
/** harbor-blue stone: the newest member, adjacent to the gap. */
export const BLUE_INDEX = 2;

const VIEWBOX = 96;
const RADIUS = 32;
const STONE_SCALE = 0.55; // stone family "S" (40px) scaled to ring pitch

/** Pure layout — exported as the test seam. Center of slot i in the 96 viewBox. */
export function slotPosition(index: number): Point {
  const a = ((-90 + index * (360 / SLOTS)) * Math.PI) / 180;
  return {
    x: VIEWBOX / 2 + RADIUS * Math.cos(a),
    y: VIEWBOX / 2 + RADIUS * Math.sin(a),
  };
}

export function Logomark({ size = 96, state = "settled" }: LogomarkProps) {
  const reduce = useReducedMotion();
  const still = reduce || state === "settled";

  // settle order: clockwise from 12, skipping the gap; the blue stone is LAST
  // (crest law — the accent arrives last and stays).
  const order: number[] = [];
  for (let i = 0; i < SLOTS; i++) {
    if (i !== GAP_INDEX && i !== BLUE_INDEX) order.push(i);
  }
  order.push(BLUE_INDEX);

  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${VIEWBOX} ${VIEWBOX}`}
      width={size}
      height={size}
      role="img"
      aria-label="Riprap: an open ring of stones, one blue, one slot open"
    >
      {order.map((slot, i) => {
        const p = slotPosition(slot);
        const blue = slot === BLUE_INDEX;
        const rad = ((-90 + slot * (360 / SLOTS)) * Math.PI) / 180;
        // Motion x/y are TRANSFORM OFFSETS, not coordinates — the slot position
        // lives on the inner <g translate(...)>. Animate deltas only:
        // assemble drops from -18px above; dissolve drifts +14px radially out.
        // Settle law: position + opacity, ease-out, no bounce.
        const drift = { x: 14 * Math.cos(rad), y: 14 * Math.sin(rad), opacity: 0 };
        const settled = { x: 0, y: 0, opacity: 1 };
        const drop = { x: 0, y: -18, opacity: 0 };
        const target = state === "dissolve" ? drift : settled;
        const from = state === "dissolve" ? settled : drop;

        return (
          <motion.g
            key={slot}
            initial={still ? settled : from}
            animate={still ? settled : target}
            transition={{ duration: SETTLE, delay: i * STAGGER, ease: SETTLE_EASE }}
          >
            <g
              transform={`translate(${p.x} ${p.y}) scale(${STONE_SCALE}) rotate(${stoneRotation(SEEDS[slot])})`}
            >
              <polygon
                points={stonePoints("S", SEEDS[slot])
                  .map((pt) => `${pt.x},${pt.y}`)
                  .join(" ")}
                fill={blue ? "var(--riprap-accent)" : "var(--riprap-stone)"}
              />
            </g>
          </motion.g>
        );
      })}
    </svg>
  );
}
