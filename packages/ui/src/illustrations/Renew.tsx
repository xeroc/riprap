import { Glyph, SettleGroup, VESSEL, VesselLines } from "./Glyph";

/**
 * renew — cover renews.
 * The pool holds its level while equal contributions keep arriving, one
 * after another. Money that comes back is what keeps the pool alive.
 */
const INSTREAM = { x: 34, y: 16, size: 8, gap: 9 };

export function Renew() {
  const { fill } = VESSEL;
  const height = fill.fullHeight * 0.45;
  return (
    <Glyph label="money keeps arriving" name="renew">
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
      {/* the stream — equal blocks, settling in one after another */}
      {[0, 1, 2].map((i) => (
        <SettleGroup key={i} delay={0.08 + i * 0.04}>
          <rect
            x={INSTREAM.x + i * INSTREAM.gap}
            y={INSTREAM.y}
            width={INSTREAM.size}
            height={INSTREAM.size}
            fill="var(--riprap-funds)"
          />
        </SettleGroup>
      ))}
    </Glyph>
  );
}
