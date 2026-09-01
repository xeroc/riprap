import { animate, useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";
import { PoolVessel } from "../atoms/PoolVessel";
import { SETTLE, SETTLE_EASE } from "./settle";

/**
 * Motion: PoolFill — the level rises with ease-out and stops.
 *
 * DESIGN.md motion law: settle, not slide — no bounce, no loop; the level
 * arrives at the balance and stays. Area = money at every intermediate frame
 * (the balance is interpolated on the fixed scale). The dashed level line
 * tracks the fill automatically — it is part of the static atom. Reduced
 * motion renders the final state.
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
  duration = SETTLE,
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
      ease: SETTLE_EASE,
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
