import { motion, useReducedMotion } from "motion/react";
import { Glyph, SETTLE, SETTLE_EASE, STAGGER, useGlyphInView, VESSEL } from "./Glyph";

/**
 * end — the pool ends.
 * No money left; the vessel itself comes apart and settles scattered.
 * The mirror of gather — the only glyph whose settled state is broken
 * apart. Used by DissolutionBand (the brand's signature moment).
 */
const { leftX, rightX, topY, floorY } = VESSEL;
const SCATTER = 6;

/** the four wall/floor segments, each drifting outward and going quiet */
const SEGMENTS = [
  { id: "left-wall", x1: leftX, y1: topY, x2: leftX, y2: floorY, dx: -SCATTER, dy: -2 },
  { id: "floor-left", x1: leftX, y1: floorY, x2: 48, y2: floorY, dx: -3, dy: SCATTER },
  { id: "floor-right", x1: 48, y1: floorY, x2: rightX, y2: floorY, dx: 3, dy: SCATTER },
  { id: "right-wall", x1: rightX, y1: topY, x2: rightX, y2: floorY, dx: SCATTER, dy: -2 },
] as const;

const TOGETHER = { opacity: 1, x: 0, y: 0 } as const;

export function End() {
  const reduced = useReducedMotion();
  const inView = useGlyphInView();
  return (
    <Glyph label="the pool ends" name="end">
      {SEGMENTS.map((seg, i) => {
        const scattered = { opacity: 0.4, x: seg.dx, y: seg.dy };
        return (
          <motion.line
            key={seg.id}
            x1={seg.x1}
            y1={seg.y1}
            x2={seg.x2}
            y2={seg.y2}
            stroke="var(--riprap-diagram-line)"
            strokeWidth={3}
            initial={reduced ? scattered : TOGETHER}
            animate={inView ? scattered : TOGETHER}
            transition={
              reduced
                ? { duration: 0 }
                : { duration: 2 * SETTLE, delay: i * STAGGER, ease: SETTLE_EASE }
            }
          />
        );
      })}
    </Glyph>
  );
}
