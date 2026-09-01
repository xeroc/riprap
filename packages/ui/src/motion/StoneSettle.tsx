import { motion, useReducedMotion } from "motion/react";
import { MemberStone } from "../atoms/MemberStone";
import type { StoneSize } from "../lib/stone";
import { SETTLE, SETTLE_EASE } from "./settle";

/**
 * Motion: StoneSettle — a stone drops into the pile and stops.
 *
 * DESIGN.md motion law: settle, not slide — ease-out 160ms, position only.
 * Stone is rigid material: no bounce, no overshoot, no rotation, no scale.
 * Reduced motion renders the settled stone (the static atom).
 */
export interface StoneSettleProps {
  size: StoneSize;
  seed: number;
  x: number;
  y: number;
  feeTag?: string;
  /** stagger slot — 40ms cadence (−−riprap-stagger) */
  delay?: number;
}

export function StoneSettle({ size, seed, x, y, feeTag, delay = 0 }: StoneSettleProps) {
  const reduced = useReducedMotion();
  return (
    <motion.g
      initial={reduced ? undefined : { opacity: 0, y: -56 }}
      animate={{ opacity: 1, y: 0 }}
      transition={reduced ? { duration: 0 } : { duration: SETTLE, delay, ease: SETTLE_EASE }}
    >
      <MemberStone size={size} seed={seed} x={x} y={y} feeTag={feeTag} />
    </motion.g>
  );
}
