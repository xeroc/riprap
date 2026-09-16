import { Glyph, SettleGroup, VESSEL, VesselLines } from "./Glyph";

/**
 * pool — one pool, one risk.
 * A vessel and its money. Nothing else — this is the shape every later
 * step builds on; it never changes.
 */
export function OnePool() {
  const { fill } = VESSEL;
  const height = fill.fullHeight * 0.5;
  return (
    <Glyph label="one pool, one risk" name="pool">
      <VesselLines />
      <SettleGroup delay={0.04}>
        <rect
          x={fill.x}
          y={fill.floorY - height}
          width={fill.width}
          height={height}
          fill="var(--riprap-funds)"
        />
      </SettleGroup>
    </Glyph>
  );
}
