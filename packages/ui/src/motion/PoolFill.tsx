import { animate, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { PoolVessel } from "../atoms/PoolVessel";

/**
 * Motion: PoolFill — the level rises to the recruited balance.
 *
 * Entrances decelerate (ease-out on the signature curve); the dashed level
 * line tracks the fill automatically — it is part of the static atom. The
 * fill stays the atom's: area = money at every intermediate frame (the
 * balance is interpolated, the scale is not). Reduced motion renders the
 * final state.
 */
export interface PoolFillProps {
  balance: number;
  maxBalance: number;
  x: number;
  y: number;
  interiorWidth?: number;
  wallHeight?: number;
  surfaceStones?: number;
  duration?: number;
}

export function PoolFill({
  balance,
  maxBalance,
  x,
  y,
  interiorWidth = 360,
  wallHeight = 260,
  surfaceStones = 0,
  duration = 0.9,
}: PoolFillProps) {
  const reduced = useReducedMotion();
  const [progress, setProgress] = useState(reduced ? 1 : 0);

  useEffect(() => {
    if (reduced) {
      setProgress(1);
      return;
    }
    const controls = animate(0, 1, {
      duration,
      ease: [0.05, 0.7, 0.1, 1], // MD3 emphasized — entrance deceleration
      onUpdate: setProgress,
    });
    return () => controls.stop();
  }, [balance, duration, reduced]);

  return (
    <PoolVessel
      balance={balance * progress}
      maxBalance={maxBalance}
      x={x}
      y={y}
      interiorWidth={interiorWidth}
      wallHeight={wallHeight}
      surfaceStones={surfaceStones}
    />
  );
}
