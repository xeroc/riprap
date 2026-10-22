import { motion, useReducedMotion } from "motion/react";
import { settleAt } from "../lib/settle";
import {
  Glyph,
  SETTLE,
  SETTLE_EASE,
  STAGGER,
  useGlyphClock,
  useGlyphInView,
  VESSEL,
  VesselLines,
} from "./Glyph";

/**
 * chip-in — the fee leaves the member and lands in the pool.
 * The member's stone at left, the vessel at right with its low level, and
 * one funds block in flight between them — arriving last, inside the pot.
 * The M→M shape in one glyph: the funder's money is the pool's money.
 */
const STONE = { x: 8, y: 40, w: 14, h: 14 };
const LEVEL = 0.22 * VESSEL.fill.fullHeight;
const BLOCK = { w: 10, h: 8, from: { x: 14, y: 34 }, to: { x: 42, y: 58 } };

export function ChipIn() {
  const clock = useGlyphClock();
  const reduced = useReducedMotion();
  const inView = useGlyphInView();
  const levelY = VESSEL.fill.floorY - LEVEL;
  const dx = BLOCK.to.x - BLOCK.from.x;
  const dy = BLOCK.to.y - BLOCK.from.y;

  if (clock) {
    // deterministic twin of the motion path below, from the glyph clock
    const p = settleAt(clock.frame / clock.fps, 2 * STAGGER, 2 * SETTLE);
    return (
      <Glyph label="the fee leaves the member and lands in the pool" name="chip-in">
        <rect
          x={STONE.x}
          y={STONE.y}
          width={STONE.w}
          height={STONE.h}
          fill="var(--riprap-diagram-stone)"
          stroke="var(--riprap-diagram-stone-edge)"
          strokeWidth={3}
        />
        <VesselLines />
        <rect
          x={VESSEL.fill.x}
          y={levelY}
          width={VESSEL.fill.width}
          height={LEVEL}
          fill="var(--riprap-funds)"
        />
        <rect
          x={BLOCK.from.x}
          y={BLOCK.from.y}
          width={BLOCK.w}
          height={BLOCK.h}
          fill="var(--riprap-funds)"
          stroke="var(--riprap-funds-ink)"
          strokeWidth={1.5}
          style={{ transform: `translate(${dx * p}px, ${dy * p}px)` }}
        />
      </Glyph>
    );
  }

  return (
    <Glyph label="the fee leaves the member and lands in the pool" name="chip-in">
      {/* the member — one stone */}
      <rect
        x={STONE.x}
        y={STONE.y}
        width={STONE.w}
        height={STONE.h}
        fill="var(--riprap-diagram-stone)"
        stroke="var(--riprap-diagram-stone-edge)"
        strokeWidth={3}
      />
      <VesselLines />
      {/* the pool's level — low, waiting */}
      <rect
        x={VESSEL.fill.x}
        y={levelY}
        width={VESSEL.fill.width}
        height={LEVEL}
        fill="var(--riprap-funds)"
      />
      {/* the fee — in flight from the stone, settles inside the pot.
          motion x/y are TRANSFORM OFFSETS, not attributes: animate the
          travel distance; the x/y attributes pin the start position. */}
      <motion.rect
        x={BLOCK.from.x}
        y={BLOCK.from.y}
        width={BLOCK.w}
        height={BLOCK.h}
        fill="var(--riprap-funds)"
        stroke="var(--riprap-funds-ink)"
        strokeWidth={1.5}
        initial={reduced ? { x: dx, y: dy } : { x: 0, y: 0 }}
        animate={inView ? { x: dx, y: dy } : { x: 0, y: 0 }}
        transition={
          reduced
            ? { duration: 0 }
            : { duration: 2 * SETTLE, delay: 2 * STAGGER, ease: SETTLE_EASE }
        }
      />
    </Glyph>
  );
}
