import { motion, useReducedMotion } from "motion/react";
import { MemberStone } from "../atoms/MemberStone";
import { SETTLE, SETTLE_EASE, SETTLE_FAST } from "./settle";

/**
 * Motion: WaveBreak — ONE wave arrival (the claims are the storm): the wave
 * mass comes in from one side, breaks apart at the pile, and clears. The
 * stones HOLD — the pile absorbs the storm; rigid stones never move.
 *
 * DESIGN.md motion law: settle, not slide — ease-out on the settle tokens,
 * no oscillating loops by default (pass `loop` to opt into a repeating
 * hero). Reduced motion renders the settled state: the pile, wave gone.
 */
export interface WaveBreakProps {
  x: number;
  y: number;
  /** pile composition — the stones that hold */
  stones?: { size: "S" | "M" | "L"; seed: number; dx: number; dy: number }[];
  /** opt-in repeating arrival (hero loops); default is one arrival */
  loop?: boolean;
}

/** one arrival = travel (SETTLE) + hold (SETTLE) + clear (SETTLE); pause only when looping */
const CYCLE = SETTLE * 3;
const PAUSE = 1.2;
const WAVE_END = -64; // where the wave meets the pile, relative to x

export function WaveBreak({
  x,
  y,
  stones = [
    { size: "M", seed: 61, dx: 24, dy: 0 },
    { size: "S", seed: 62, dx: 72, dy: 8 },
    { size: "L", seed: 63, dx: 120, dy: -4 },
  ],
  loop = false,
}: WaveBreakProps) {
  const reduced = useReducedMotion();
  const wavePath = "M 0 0 q 36 -52 84 -20 q 28 20 12 52 l -96 0 z";

  const pile = stones.map((s) => (
    <MemberStone key={s.seed} size={s.size} seed={s.seed} x={x + s.dx} y={y + s.dy} />
  ));

  if (reduced) {
    // settled state: the wave already broke and cleared; only the pile remains
    return <g>{pile}</g>;
  }

  return (
    <g>
      {/* the pile — it holds */}
      {pile}

      {/* the wave mass — arrives on the settle curve, breaks, clears */}
      <motion.path
        d={wavePath}
        fill="var(--riprap-peril)"
        initial={{ x: x - 200, y: y - 44, opacity: 0 }}
        animate={{
          x: [x - 200, x + WAVE_END, x + WAVE_END, x + WAVE_END],
          y: [y - 44, y - 40, y - 40, y - 40],
          opacity: [0, 1, 1, 0],
        }}
        transition={{
          duration: CYCLE,
          times: [0, 1 / 3, 2 / 3, 1],
          ease: SETTLE_EASE,
          repeat: loop ? Number.POSITIVE_INFINITY : 0,
          repeatDelay: loop ? PAUSE : undefined,
        }}
      />

      {/* droplets — the wave breaking apart on impact, then gone */}
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
            duration: SETTLE_FAST,
            delay: SETTLE,
            times: [0, 0.5, 1],
            ease: SETTLE_EASE,
            repeat: loop ? Number.POSITIVE_INFINITY : 0,
            // keep the burst on the same cycle as the wave (delay applies once)
            repeatDelay: loop ? CYCLE + PAUSE - SETTLE_FAST : undefined,
          }}
        />
      ))}
    </g>
  );
}
