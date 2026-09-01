import { motion, useReducedMotion } from "motion/react";
import { Dissolution, StoneTicks } from "../atoms/Dissolution";
import { MemberStone } from "../atoms/MemberStone";
import { VesselOutline } from "../atoms/VesselOutline";
import type { StoneSize } from "../lib/stone";

/**
 * Motion: DissolutionScatter — stones accelerate outward with their motion
 * ticks while the vessel fades to its dashed past tense.
 *
 * Exits accelerate (ease-in family — MD3 accelerate); rigid stones get no
 * overshoot; stagger 50ms within the budget. Geometry comes from the
 * static atom's own scatter table (same stones, same directions); reduced
 * motion renders the static Dissolution atom — its final state.
 */
export interface DissolutionScatterProps {
  x: number;
  y: number;
  interiorWidth?: number;
  wallHeight?: number;
}

const SCATTER: { dx: number; dy: number; size: StoneSize }[] = [
  { dx: -0.9, dy: -0.7, size: "S" },
  { dx: -0.4, dy: -1.1, size: "M" },
  { dx: 0.5, dy: -0.9, size: "S" },
  { dx: 1.0, dy: -0.5, size: "M" },
  { dx: -1.2, dy: 0.2, size: "S" },
  { dx: 1.2, dy: 0.3, size: "S" },
];

export function DissolutionScatter({
  x,
  y,
  interiorWidth = 176,
  wallHeight = 128,
}: DissolutionScatterProps) {
  const reduced = useReducedMotion();

  if (reduced) {
    return <Dissolution x={x} y={y} interiorWidth={interiorWidth} wallHeight={wallHeight} />;
  }

  const cx = x + interiorWidth / 2;
  const cy = y + wallHeight / 2;
  const radius = interiorWidth * 0.72;

  return (
    <g>
      {/* the vessel fading to dashed — dash is the past tense */}
      <motion.g
        initial={{ opacity: 1 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: 0.56, ease: [0.4, 0, 0.2, 1] }}
      >
        <VesselOutline x={x} y={y} width={interiorWidth} height={wallHeight} dashed doors />
      </motion.g>

      {/* stones accelerate outward — each with its ticks */}
      {SCATTER.map((s, i) => {
        const norm = Math.hypot(s.dx, s.dy) || 1;
        const ux = s.dx / norm;
        const uy = s.dy / norm;
        const startX = cx + s.dx * radius * 0.3;
        const startY = cy + s.dy * radius * 0.3;
        const endX = cx + s.dx * radius;
        const endY = cy + s.dy * radius * 0.8;
        return (
          <motion.g
            key={i}
            initial={{ x: 0, y: 0, opacity: 0.8 }}
            animate={{ x: endX - startX, y: endY - startY, opacity: 1 }}
            transition={{ duration: 0.48, delay: i * 0.05, ease: [0.3, 0, 1, 1] }}
          >
            <StoneTicks x={startX} y={startY} dx={ux} dy={uy} />
            <MemberStone size={s.size} seed={42 + i} x={startX} y={startY} />
          </motion.g>
        );
      })}
    </g>
  );
}
