import { motion, useReducedMotion } from "motion/react";
import { Dissolution, StoneTicks } from "../atoms/Dissolution";
import { MemberStone } from "../atoms/MemberStone";
import { VesselOutline } from "../atoms/VesselOutline";
import type { StoneSize } from "../lib/stone";
import { SETTLE, SETTLE_EASE, STAGGER } from "./settle";

/**
 * Motion: DissolutionScatter — the pile disperses: stones exit off-frame
 * with their motion ticks (the only place ticks appear) while the vessel
 * dereferences to its dashed past tense. One pass, ease-out, then still —
 * no loop. Reduced motion renders the static Dissolution atom, the settled
 * end state.
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

/** exit travel in scatter radii — far enough to cross the frame edge;
 *  anything past the viewBox is clipped by the svg element (off-frame) */
const EXIT = 2;

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
      {/* the vessel dereferences to dashed — dash is the past tense */}
      <motion.g
        initial={{ opacity: 1 }}
        animate={{ opacity: 0.5 }}
        transition={{ duration: SETTLE, ease: SETTLE_EASE }}
      >
        <VesselOutline x={x} y={y} width={interiorWidth} height={wallHeight} dashed doors />
      </motion.g>

      {/* stones exit off-frame — each with its ticks, one settle per stone */}
      {SCATTER.map((s, i) => {
        const norm = Math.hypot(s.dx, s.dy) || 1;
        const ux = s.dx / norm;
        const uy = s.dy / norm;
        const startX = cx + s.dx * radius * 0.3;
        const startY = cy + s.dy * radius * 0.3;
        const endX = cx + s.dx * radius * EXIT;
        const endY = cy + s.dy * radius * 0.8 * EXIT;
        return (
          <motion.g
            key={i}
            initial={{ x: 0, y: 0, opacity: 0.8 }}
            animate={{ x: endX - startX, y: endY - startY, opacity: 1 }}
            transition={{ duration: SETTLE, delay: i * STAGGER, ease: SETTLE_EASE }}
          >
            <StoneTicks x={startX} y={startY} dx={ux} dy={uy} />
            <MemberStone size={s.size} seed={42 + i} x={startX} y={startY} />
          </motion.g>
        );
      })}
    </g>
  );
}
