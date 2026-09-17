/**
 * @riprap/ui — public API.
 *
 * Layers: tokens.css → lib (pure math) → illustrations (one-concept glyphs)
 * → chrome (shadcn primitives restyled to DESIGN.md + brand bands).
 * Every component is data-bound: props carry the on-chain/numeric values,
 * visuals never invent numbers.
 */

// UI chrome layer (shadcn primitives restyled to DESIGN.md + brand bands)
export * from "./components";
export { Backstop } from "./illustrations/Backstop";
export { Claim } from "./illustrations/Claim";
export { ExpansionStrip } from "./illustrations/ExpansionStrip";
export { Found } from "./illustrations/Found";
export { Gather } from "./illustrations/Gather";
export type { GlyphClock } from "./illustrations/Glyph";
export {
  ENTER,
  Glyph,
  GlyphClockProvider,
  SETTLE,
  SETTLE_EASE,
  SETTLED,
  SettleGroup,
  STAGGER,
  STROKE,
  settle,
  useGlyphClock,
} from "./illustrations/Glyph";
// illustrations — one concept per glyph, settle motion built in
export type { HexBackdropProps } from "./illustrations/HexBackdrop";
export { HexBackdrop } from "./illustrations/HexBackdrop";
export { Join } from "./illustrations/Join";
export { LifecycleStrip } from "./illustrations/LifecycleStrip";
export { OnePool } from "./illustrations/OnePool";
export { Renew } from "./illustrations/Renew";
export { Return } from "./illustrations/Return";
export { Rule } from "./illustrations/Rule";
export { Stack } from "./illustrations/Stack";
// lib
export type { Tier, TierName } from "./lib/poolMath";
export { fillHeight, proRataShare, scaledPayout, TIERS, tierFor, usd } from "./lib/poolMath";
export { cubicBezier, easeInOut, settleAt } from "./lib/settle";
export type { Point, StoneSize } from "./lib/stone";
export { STONE_SIZES, stonePoints, stoneRotation } from "./lib/stone";
