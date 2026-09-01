/**
 * Balance trace geometry — pool-with-level flattened into a line
 * (composition.md § scene 4): same area-equals-money binding, temporal
 * instead of spatial. Shared by the lifecycle overview scene and the
 * BalanceTrace motion component so both draw the identical line.
 */

export interface TracePoint {
  x: number;
  y: number;
}

/** Monospace-stepped polyline: caller supplies the corner points (H/V steps). */
export function steppedPath(points: TracePoint[]): string {
  return points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
}

/**
 * Balance → y on the shared money scale, snapped to the 4px grid.
 * maxBalance maps to yTop; 0 maps to yBase.
 */
export function moneyY(balance: number, maxBalance: number, yBase: number, yTop: number): number {
  if (maxBalance <= 0) return yBase;
  const t = Math.max(0, Math.min(1, balance / maxBalance));
  return Math.round((yBase - t * (yBase - yTop)) / 4) * 4;
}
