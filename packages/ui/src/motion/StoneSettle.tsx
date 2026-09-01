import { motion, useReducedMotion } from "motion/react";
import { MemberStone } from "../atoms/MemberStone";
import type { StoneSize } from "../lib/stone";

/**
 * Motion: StoneSettle — a stone drops and settles into the pile.
 *
 * Motion law (motion-design skill, Premium/Corporate personality): stone is
 * RIGID material — 1.2× duration scale (560ms), 0% overshoot, stones never
 * bounce. Entrance decelerates on the signature curve. The static atom
 * (MemberStone) stays the base render.
 */
export interface StoneSettleProps {
  size: StoneSize;
  seed: number;
  x: number;
  y: number;
  feeTag?: string;
  /** stagger slot — 50–100ms cadence, total budget < 400ms */
  delay?: number;
}

export function StoneSettle({ size, seed, x, y, feeTag, delay = 0 }: StoneSettleProps) {
  const reduced = useReducedMotion();
  return (
    <motion.g
      initial={reduced ? undefined : { opacity: 0, y: -56 }}
      animate={{ opacity: 1, y: 0 }}
      transition={
        reduced ? { duration: 0 } : { duration: 0.56, delay, ease: [0.4, 0, 0.2, 1] } // var(--riprap-ease)
      }
    >
      <MemberStone size={size} seed={seed} x={x} y={y} feeTag={feeTag} />
    </motion.g>
  );
}
