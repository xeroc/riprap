import { motion, useReducedMotion } from "motion/react";
import { settleAt } from "../lib/settle";
import {
  ENTER,
  Glyph,
  SETTLE,
  SETTLE_EASE,
  SETTLED,
  STAGGER,
  useGlyphClock,
  useGlyphInView,
  VESSEL,
  VesselLines,
} from "./Glyph";

/**
 * gather — money gathers into one pool.
 * One vessel; the level rises and settles. Nothing else.
 */
export function Gather() {
  const clock = useGlyphClock();
  const reduced = useReducedMotion();
  const inView = useGlyphInView();
  const { fill } = VESSEL;
  const level = 0.6;
  const height = fill.fullHeight * level;
  const risen = { height, y: fill.floorY - height };

  if (clock) {
    // deterministic twin of the motion path below, from the glyph clock
    const t = clock.frame / clock.fps;
    const fillP = settleAt(t, STAGGER * 2, 2 * SETTLE);
    const lineP = settleAt(t, STAGGER * 8, SETTLE);
    const h = height * fillP;
    return (
      <Glyph label="money gathers" name="gather">
        <VesselLines />
        <rect
          x={fill.x}
          width={fill.width}
          height={h}
          fill="var(--riprap-funds)"
          style={{ transform: `translateY(${fill.floorY - h}px)` }}
        />
        <line
          x1={fill.x}
          x2={fill.x + fill.width}
          y1={fill.floorY - height}
          y2={fill.floorY - height}
          stroke="var(--riprap-diagram-ink)"
          strokeWidth={1.5}
          strokeDasharray="4 3"
          style={{ opacity: lineP, transform: `translateY(${(1 - lineP) * -12}px)` }}
        />
      </Glyph>
    );
  }

  return (
    <Glyph label="money gathers" name="gather">
      <VesselLines />
      {/* the level — grows from the floor, settles. The y ATTRIBUTE stays 0
          (unset); motion animates y as a translateY = the level's top edge. */}
      <motion.rect
        x={fill.x}
        width={fill.width}
        fill="var(--riprap-funds)"
        initial={reduced ? risen : { height: 0, y: fill.floorY }}
        animate={inView ? risen : { height: 0, y: fill.floorY }}
        transition={
          reduced
            ? { duration: 0 }
            : { duration: 2 * SETTLE, delay: STAGGER * 2, ease: SETTLE_EASE }
        }
      />
      {/* the level line — dashed ink rule on the surface */}
      <motion.line
        x1={fill.x}
        x2={fill.x + fill.width}
        y1={fill.floorY - height}
        y2={fill.floorY - height}
        stroke="var(--riprap-diagram-ink)"
        strokeWidth={1.5}
        strokeDasharray="4 3"
        initial={reduced ? SETTLED : ENTER}
        animate={inView ? SETTLED : ENTER}
        transition={
          reduced ? { duration: 0 } : { duration: SETTLE, delay: STAGGER * 8, ease: SETTLE_EASE }
        }
      />
    </Glyph>
  );
}
