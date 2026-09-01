import { motion, useReducedMotion } from "motion/react";
import { Glyph, SETTLE, SETTLE_EASE, STAGGER, useGlyphInView, VESSEL, VesselLines } from "./Glyph";

/**
 * claim — a claim is paid.
 * Money leaves the pool through one opening in the wall. One block, one
 * door — the only way out besides the end.
 */
const BLOCK = { width: 10, height: 8, y: 50 }; // sits in the door gap (50..58)
const INSIDE_X = 56;
const OUTSIDE_X = 78;

export function Claim() {
  const reduced = useReducedMotion();
  const inView = useGlyphInView();
  const { fill } = VESSEL;
  return (
    <Glyph label="a claim is paid out" name="claim">
      <VesselLines door />
      {/* the pool's money — resting below the door */}
      <rect
        x={fill.x}
        y={BLOCK.y + BLOCK.height - 1.5}
        width={fill.width}
        height={fill.floorY - (BLOCK.y + BLOCK.height - 1.5)}
        fill="var(--riprap-funds)"
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
