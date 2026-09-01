/**
 * Settle-timing tokens as motion values — DESIGN.md motion law:
 * "settle, not slide". Ease-out ~160ms, stagger 40ms. No bounce, no elastic,
 * no overshoot, no oscillating loops, no glow, no parallax.
 *
 * These mirror the CSS tokens in src/tokens.css (the frozen contract):
 *   --riprap-settle        160ms cubic-bezier(0.215, 0.61, 0.355, 1)
 *   --riprap-settle-fast   120ms cubic-bezier(0.215, 0.61, 0.355, 1)
 *   --riprap-stagger        40ms
 * framer-motion needs numeric seconds, so the bezier lives here too.
 * (MarkAssemble.test.tsx pins these to tokens.css.)
 */

/** --riprap-settle — 160ms */
export const SETTLE = 0.16;
/** --riprap-settle-fast — 120ms */
export const SETTLE_FAST = 0.12;
/** --riprap-stagger — 40ms */
export const STAGGER = 0.04;
/** the ease-out quart curve of --riprap-settle */
export const SETTLE_EASE: [number, number, number, number] = [0.215, 0.61, 0.355, 1];
