import { motion, useReducedMotion } from "motion/react";
import { MemberStone } from "../atoms/MemberStone";

/**
 * Motion: WaveBreak — the hero: a wave mass (the peril) hits the stone pile
 * from one side; the stones HOLD (no motion on them — the pile absorbs the
 * storm); the wave breaks apart.
 *
 * Layers: primary = the wave mass translating in (decelerate), secondary =
 * droplets scattering out at impact (ease-out), ambient = the wave's own
 * opacity pulse. One wave, loops with a pause. Rigid stones never move.
 */
export interface WaveBreakProps {
  x: number;
  y: number;
  /** pile composition — the stones that hold */
  stones?: { size: "S" | "M" | "L"; seed: number; dx: number; dy: number }[];
}

const LOOP = 2.4; // seconds per cycle, including the pause

export function WaveBreak({
  x,
  y,
  stones = [
    { size: "M", seed: 61, dx: 24, dy: 0 },
    { size: "S", seed: 62, dx: 72, dy: 8 },
    { size: "L", seed: 63, dx: 120, dy: -4 },
  ],
}: WaveBreakProps) {
  const reduced = useReducedMotion();
  const wavePath = "M 0 0 q 36 -52 84 -20 q 28 20 12 52 l -96 0 z";

  if (reduced) {
    // final state: the wave broke apart; only the pile remains
    return (
      <g>
        {stones.map((s) => (
          <MemberStone key={s.seed} size={s.size} seed={s.seed} x={x + s.dx} y={y + s.dy} />
        ))}
      </g>
    );
  }

  return (
    <g>
      {/* the pile — it holds */}
      {stones.map((s) => (
        <MemberStone key={s.seed} size={s.size} seed={s.seed} x={x + s.dx} y={y + s.dy} />
      ))}

      {/* the wave mass — travels in, breaks apart at the pile */}
      <motion.path
        d={wavePath}
        fill="var(--riprap-peril)"
        initial={{ x: x - 200, y: y - 44, opacity: 0 }}
        animate={{
          x: [x - 200, x - 76, x - 64, x - 200],
          y: [y - 44, y - 40, y - 36, y - 44],
          opacity: [0, 1, 1, 0],
        }}
        transition={{
          duration: 1.1,
          times: [0, 0.42, 0.62, 1],
          ease: ["easeOut", "linear", "easeIn"],
          repeat: Infinity,
          repeatDelay: LOOP - 1.1,
        }}
      />

      {/* droplets — the wave breaking apart on impact */}
      {[
        { dx: -28, dy: -40 },
        { dx: 8, dy: -56 },
        { dx: 40, dy: -32 },
      ].map((d, i) => (
        <motion.circle
          key={i}
          r={7}
          fill="var(--riprap-peril)"
          cx={x - 48 + i * 16}
          cy={y - 8}
          initial={{ opacity: 0, x: 0, y: 0 }}
          animate={{ opacity: [0, 1, 0], x: [0, d.dx, d.dx * 1.6], y: [0, d.dy, d.dy * 1.4] }}
          transition={{
            duration: 0.5,
            delay: 0.5 + i * 0.04,
            times: [0, 0.45, 1],
            ease: "easeOut",
            repeat: Infinity,
            repeatDelay: LOOP - 0.5,
          }}
        />
      ))}
    </g>
  );
}
