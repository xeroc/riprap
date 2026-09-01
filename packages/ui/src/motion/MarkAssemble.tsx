import { motion, useReducedMotion } from "motion/react";
import { MemberStone } from "../atoms/MemberStone";
import { SETTLE, SETTLE_EASE, STAGGER } from "./settle";

/**
 * Motion: MarkAssemble — the brand mark assembles (DESIGN.md): 7 stone-grey
 * stones drop-settle bottom-up, the harbor-blue crest stone lands LAST.
 * ~40ms stagger, position only — no rotation, no scale, no bounce. The hero
 * load / pool-open moment; DissolutionScatter is its mirror (pool close).
 *
 * Reduced motion (and print/favicon) is always the settled mark.
 */
export interface MarkAssembleProps {
  /** pile center */
  x: number;
  /** pile baseline (bottom row rests just above it) */
  y: number;
  /** uniform scale — 0.5 ≈ the 64px footer anchor */
  scale?: number;
  /** stagger slot before the first stone lands */
  delay?: number;
}

/** The settled pile, bottom row first — assembly order = build order. */
const PILE: { x: number; y: number; seed: number }[] = [
  // bottom row — the foundation
  { x: -45, y: -20, seed: 71 },
  { x: -15, y: -20, seed: 72 },
  { x: 15, y: -20, seed: 73 },
  { x: 45, y: -20, seed: 74 },
  // middle row
  { x: -30, y: -46, seed: 75 },
  { x: 0, y: -46, seed: 76 },
  { x: 30, y: -46, seed: 77 },
];

/** the crest — harbor-blue, lands last */
const CREST = { x: 36, y: -70, seed: 78 };

export function MarkAssemble({ x, y, scale = 1, delay = 0 }: MarkAssembleProps) {
  const reduced = useReducedMotion();
  const stones = [...PILE, CREST];
  return (
    <g transform={`translate(${x} ${y}) scale(${scale})`}>
      {stones.map((s, i) => (
        <motion.g
          key={s.seed}
          initial={reduced ? undefined : { opacity: 0, y: -48 }}
          animate={{ opacity: 1, y: 0 }}
          transition={
            reduced
              ? { duration: 0 }
              : { duration: SETTLE, delay: delay + i * STAGGER, ease: SETTLE_EASE }
          }
        >
          <MemberStone
            size="S"
            seed={s.seed}
            x={s.x}
            y={s.y}
            fillColor={i === stones.length - 1 ? "var(--riprap-funds)" : undefined}
          />
        </motion.g>
      ))}
    </g>
  );
}
