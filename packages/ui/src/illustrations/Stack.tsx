import { motion, useReducedMotion } from "motion/react";
import { Glyph, SETTLE, SETTLE_EASE, STAGGER, STROKE, useGlyphInView } from "./Glyph";

/**
 * stack — a pool covers a pool.
 * A small pool above, a large pool below, and one block of money passing
 * between them through the small pool's door. Sharing the tail is how a
 * pool safely holds less — the same trick, run between pools.
 */
const LEAF = { leftX: 14, rightX: 46, topY: 8, floorY: 38, doorTop: 24, doorBottom: 32 };
const PARENT = { leftX: 50, rightX: 90, topY: 58, floorY: 92 };
const BLOCK = { x: 34, y: 25, width: 8, height: 6 };
const TRAVEL = { x: 30, y: 41 }; // lands inside the parent, above its level

function LeafLines() {
  const { leftX, rightX, topY, floorY, doorTop, doorBottom } = LEAF;
  return (
    <>
      <line
        x1={leftX}
        y1={topY}
        x2={leftX}
        y2={floorY}
        stroke="var(--riprap-diagram-line)"
        strokeWidth={STROKE}
      />
      <line
        x1={leftX}
        y1={floorY}
        x2={rightX}
        y2={floorY}
        stroke="var(--riprap-diagram-line)"
        strokeWidth={STROKE}
      />
      {/* right wall — split by the door gap */}
      <line
        x1={rightX}
        y1={topY}
        x2={rightX}
        y2={doorTop}
        stroke="var(--riprap-diagram-line)"
        strokeWidth={STROKE}
      />
      <line
        x1={rightX}
        y1={doorBottom}
        x2={rightX}
        y2={floorY}
        stroke="var(--riprap-diagram-line)"
        strokeWidth={STROKE}
      />
    </>
  );
}

function ParentLines() {
  const { leftX, rightX, topY, floorY } = PARENT;
  return (
    <>
      <line
        x1={leftX}
        y1={topY}
        x2={leftX}
        y2={floorY}
        stroke="var(--riprap-diagram-line)"
        strokeWidth={STROKE}
      />
      <line
        x1={leftX}
        y1={floorY}
        x2={rightX}
        y2={floorY}
        stroke="var(--riprap-diagram-line)"
        strokeWidth={STROKE}
      />
      <line
        x1={rightX}
        y1={topY}
        x2={rightX}
        y2={floorY}
        stroke="var(--riprap-diagram-line)"
        strokeWidth={STROKE}
      />
    </>
  );
}

export function Stack() {
  const reduced = useReducedMotion();
  const inView = useGlyphInView();
  return (
    <Glyph label="a pool covers a pool" name="stack">
      {/* the parent — holds the tail, settles first */}
      <ParentLines />
      <rect x={51.5} y={76.5} width={37} height={14} fill="var(--riprap-funds)" />
      {/* the leaf — first loss, above */}
      <LeafLines />
      <rect x={15.5} y={26.5} width={29} height={10} fill="var(--riprap-funds)" />
      {/* the shared block — leaves the leaf through its door, lands in the parent.
          motion x/y are TRANSFORM OFFSETS, not attributes (Claim idiom). */}
      <motion.rect
        x={BLOCK.x}
        y={BLOCK.y}
        width={BLOCK.width}
        height={BLOCK.height}
        fill="var(--riprap-funds)"
        stroke="var(--riprap-funds-ink)"
        strokeWidth={1.5}
        initial={reduced ? TRAVEL : { x: 0, y: 0 }}
        animate={inView ? TRAVEL : { x: 0, y: 0 }}
        transition={
          reduced
            ? { duration: 0 }
            : { duration: 2 * SETTLE, delay: 3 * STAGGER, ease: SETTLE_EASE }
        }
      />
    </Glyph>
  );
}
