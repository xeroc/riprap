/**
 * Settle math — the deterministic twin of the kit's wall-clock motion.
 *
 * Source of truth: DESIGN.md § Motion + tokens.css (`--riprap-settle`,
 * `--riprap-stagger`). The `motion/react` components animate these same
 * numbers on viewport arrival; the functions here evaluate the identical
 * curve from an explicit elapsed time so frame-accurate consumers
 * (Remotion video, stills) reproduce the arrival byte-for-byte.
 */

/** --riprap-settle: 160ms ease-out quart. */
export const SETTLE = 0.16;

/** --riprap-stagger: 40ms between arriving elements. */
export const STAGGER = 0.04;

/** cubic-bezier(0.215, 0.61, 0.355, 1) — matches tokens.css --riprap-settle. */
export const SETTLE_EASE = [0.215, 0.61, 0.355, 1] as const;

/** CSS cubic-bezier(x1, y1, x2, y2) as a pure function (Newton–Raphson). */
export function cubicBezier(x1: number, y1: number, x2: number, y2: number) {
  const ax = 3 * x1 - 3 * x2 + 1;
  const bx = 3 * x2 - 6 * x1;
  const cx = 3 * x1;

  const sampleX = (u: number) => ((ax * u + bx) * u + cx) * u;
  const sampleXDerivative = (u: number) => (3 * ax * u + 2 * bx) * u + cx;
  const sampleY = (u: number) => {
    const ay = 3 * y1 - 3 * y2 + 1;
    const by = 3 * y2 - 6 * y1;
    const cy = 3 * y1;
    return ((ay * u + by) * u + cy) * u;
  };

  return (x: number): number => {
    if (x <= 0) return 0;
    if (x >= 1) return 1;
    // Newton–Raphson from a linear initial guess; bisection fallback.
    let u = x;
    for (let i = 0; i < 10; i++) {
      const err = sampleX(u) - x;
      if (Math.abs(err) < 1e-7) return sampleY(u);
      const derivative = sampleXDerivative(u);
      if (Math.abs(derivative) < 1e-6) break;
      u -= err / derivative;
    }
    let low = 0;
    let high = 1;
    u = x;
    for (let i = 0; i < 24; i++) {
      const err = sampleX(u) - x;
      if (Math.abs(err) < 1e-7) break;
      if (err > 0) high = u;
      else low = u;
      u = (low + high) / 2;
    }
    return sampleY(u);
  };
}

const settleCurve = cubicBezier(...SETTLE_EASE);

/**
 * Eased arrival progress at `elapsed` seconds: 0 until `delay`, then the
 * settle curve over `duration` (default one settle = 160ms), 1 after.
 */
export function settleAt(elapsed: number, delay = 0, duration = SETTLE): number {
  if (duration <= 0) return elapsed >= delay ? 1 : 0;
  const linear = (elapsed - delay) / duration;
  if (linear <= 0) return 0;
  if (linear >= 1) return 1;
  return settleCurve(linear);
}

/**
 * Symmetric ease-in-out over a normalized 0→1→0 cycle (rise on the first
 * half, fall on the second) — the breathing curve of HexBackdrop's ambient
 * cells, evaluated deterministically.
 */
export function easeInOut(cycleFraction: number): number {
  const f = Math.min(1, Math.max(0, cycleFraction));
  const half = f < 0.5 ? f * 2 : (1 - f) * 2;
  // smoothstep — the standard symmetric ease-in-out shape
  return half * half * (3 - 2 * half);
}
