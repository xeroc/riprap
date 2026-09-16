import { Glyph, SettleGroup, VESSEL, VesselLines } from "./Glyph";

/**
 * backstop — a backstop grows.
 * The pool stays what it is; beneath its floor, a reserve settles in and
 * thickens. Structure, not pool money — the stones carry the tail so the
 * pool above can hold less.
 */
const SLABS = [
  { x: 18, width: 60, y: 76 },
  { x: 10, width: 76, y: 86 },
];
const SLAB_HEIGHT = 8;

export function Backstop() {
  const { fill } = VESSEL;
  const height = fill.fullHeight * 0.5;
  return (
    <Glyph label="a backstop grows beneath the pool" name="backstop">
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
      {/* the reserve — slabs settling in beneath, one after the other */}
      {SLABS.map((slab, i) => (
        <SettleGroup key={slab.y} delay={0.12 + i * 0.04}>
          <rect
            x={slab.x}
            y={slab.y}
            width={slab.width}
            height={SLAB_HEIGHT}
            fill="var(--riprap-diagram-stone)"
            stroke="var(--riprap-diagram-stone-edge)"
            strokeWidth={1.5}
          />
        </SettleGroup>
      ))}
    </Glyph>
  );
}
