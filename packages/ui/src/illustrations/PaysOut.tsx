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
 * pays-out — the ruling releases the money.
 * Claim's payout idiom (one door, the block leaves the pool) with Rule's
 * verdict above it: one deliberation vote square, check knocked out. The
 * ruling arrives, then the money moves — no ruling, no door.
 */
const BLOCK = { width: 10, height: 8, y: 50 }; // sits in the door gap (50..58)
const INSIDE_X = 56;
const OUTSIDE_X = 78;
const VOTE = { x: 64, y: 22, w: 14, h: 14 };
const CHECK = "M3.5 7 6 9.5 10.4 4";

export function PaysOut() {
  const clock = useGlyphClock();
  const reduced = useReducedMotion();
  const inView = useGlyphInView();
  const { fill } = VESSEL;

  if (clock) {
    // deterministic twin of the motion path below, from the glyph clock
    const p = settleAt(clock.frame / clock.fps, 3 * STAGGER, 2 * SETTLE);
    return (
      <Glyph label="the ruling releases the money" name="pays-out">
        <VesselLines door />
        <rect
          x={fill.x}
          y={BLOCK.y + BLOCK.height - 1.5}
          width={fill.width}
          height={fill.floorY - (BLOCK.y + BLOCK.height - 1.5)}
          fill="var(--riprap-funds)"
        />
        <rect
          x={VOTE.x}
          y={VOTE.y}
          width={VOTE.w}
          height={VOTE.h}
          fill="var(--riprap-deliberation)"
          stroke="var(--riprap-deliberation)"
          strokeWidth={3}
        />
        <path
          d={CHECK}
          transform={`translate(${VOTE.x} ${VOTE.y})`}
          fill="none"
          stroke="var(--riprap-diagram-canvas)"
          strokeWidth={3}
        />
        <rect
          x={INSIDE_X}
          y={BLOCK.y}
          width={BLOCK.width}
          height={BLOCK.height}
          fill="var(--riprap-funds)"
          stroke="var(--riprap-funds-ink)"
          strokeWidth={1.5}
          style={{ transform: `translateX(${(OUTSIDE_X - INSIDE_X) * p}px)` }}
        />
      </Glyph>
    );
  }

  return (
    <Glyph label="the ruling releases the money" name="pays-out">
      <VesselLines door />
      {/* the pool's money — resting below the door */}
      <rect
        x={fill.x}
        y={BLOCK.y + BLOCK.height - 1.5}
        width={fill.width}
        height={fill.floorY - (BLOCK.y + BLOCK.height - 1.5)}
        fill="var(--riprap-funds)"
      />
      {/* the ruling — one vote, check knocked out (rule's idiom), settles
          before the money moves */}
      <rect
        x={VOTE.x}
        y={VOTE.y}
        width={VOTE.w}
        height={VOTE.h}
        fill="var(--riprap-deliberation)"
        stroke="var(--riprap-deliberation)"
        strokeWidth={3}
      />
      <path
        d={CHECK}
        transform={`translate(${VOTE.x} ${VOTE.y})`}
        fill="none"
        stroke="var(--riprap-diagram-canvas)"
        strokeWidth={3}
      />
      {/* the paid block — leaves through the door and settles outside.
          motion x/y are TRANSFORM OFFSETS, not attributes: animate the
          travel distance; the x attribute pins the start position. */}
      <motion.rect
        x={INSIDE_X}
        y={BLOCK.y}
        width={BLOCK.width}
        height={BLOCK.height}
        fill="var(--riprap-funds)"
        stroke="var(--riprap-funds-ink)"
        strokeWidth={1.5}
        initial={reduced ? { x: OUTSIDE_X - INSIDE_X } : { x: 0 }}
        animate={inView ? { x: OUTSIDE_X - INSIDE_X } : { x: 0 }}
        transition={
          reduced
            ? { duration: 0 }
            : { duration: 2 * SETTLE, delay: 3 * STAGGER, ease: SETTLE_EASE }
        }
      />
    </Glyph>
  );
}
