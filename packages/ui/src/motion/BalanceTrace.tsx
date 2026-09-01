import { motion, useReducedMotion } from "motion/react";
import { SvgText } from "../atoms/SvgFrame";
import { usd } from "../lib/poolMath";
import { moneyY, steppedPath } from "../lib/trace";

/**
 * Motion: BalanceTrace — the stepped balance line draws itself through the
 * worked-example points ($20,000 → $12,000 → $0); the labeled points land
 * staggered after their segment.
 *
 * Same binding as the lifecycle overview's trace (lib/trace): pool-with-
 * level flattened into a line. Primary = the line draw (pathLength,
 * decelerating); secondary = points popping in on the signature curve.
 */
export interface BalanceTraceProps {
  /** stepped balances over time, starting at the first change point */
  balances?: number[];
  /** shared money scale */
  maxBalance?: number;
  x?: number;
  y?: number;
  width?: number;
  /** trace band: yBase ($0) .. yTop (maxBalance) */
  yBase?: number;
  yTop?: number;
}

export function BalanceTrace({
  balances = [20000, 12000, 0],
  maxBalance = 20000,
  x = 40,
  y = 0,
  width = 560,
  yBase = 160,
  yTop = 40,
}: BalanceTraceProps) {
  const reduced = useReducedMotion();

  // corners: start flat at $0, hold each value until the next change, end flat
  const stepW = width / (balances.length + 1);
  const corners = [{ x, y: yBase }];
  balances.forEach((b, i) => {
    const vx = Math.round((x + stepW * (i + 1)) / 4) * 4;
    const vy = moneyY(b, maxBalance, yBase, yTop) + y;
    corners.push({ x: vx, y: corners[corners.length - 1].y }, { x: vx, y: vy });
  });
  corners.push({ x: x + width, y: corners[corners.length - 1].y });
  const d = steppedPath(corners);
  const points = balances.map((b, i) => ({
    x: Math.round((x + stepW * (i + 1)) / 4) * 4,
    y: moneyY(b, maxBalance, yBase, yTop) + y,
    label: usd(b),
  }));

  return (
    <g>
      <line
        x1={x}
        y1={yBase + y}
        x2={x + width}
        y2={yBase + y}
        stroke="var(--riprap-line)"
        strokeWidth={3}
      />
      <motion.path
        d={d}
        fill="none"
        stroke="var(--riprap-funds)"
        strokeWidth={3}
        initial={reduced ? undefined : { pathLength: 0 }}
        animate={{ pathLength: 1 }}
        transition={reduced ? { duration: 0 } : { duration: 0.9, ease: [0.05, 0.7, 0.1, 1] }}
      />
      {points.map((p, i) => (
        <motion.g
          key={p.label}
          initial={reduced ? undefined : { opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={reduced ? { duration: 0 } : { duration: 0.18, delay: 0.3 + i * 0.1 }}
        >
          <circle cx={p.x} cy={p.y} r={5} fill="var(--riprap-funds)" />
          <SvgText
            x={p.x}
            y={p.y === yBase + y ? p.y + 24 : p.y - 14}
            size={16}
            fill="var(--riprap-funds)"
            mono
            anchor="middle"
          >
            {p.label}
          </SvgText>
        </motion.g>
      ))}
    </g>
  );
}
