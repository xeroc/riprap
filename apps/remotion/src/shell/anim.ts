import { settleAt } from "@riprap/ui";
import type { CSSProperties } from "react";

/**
 * Scene staging on the kit's settle law: the identical 160ms ease-out
 * arrival (12px drop, opacity) evaluated from the composition clock —
 * the HTML twin of the kit's SettleGroup, for scene typography.
 */
export function settleStyle(frame: number, fps: number, delay = 0): CSSProperties {
  const p = settleAt(frame / fps, delay);
  return { opacity: p, transform: `translateY(${(1 - p) * -12}px)` };
}
