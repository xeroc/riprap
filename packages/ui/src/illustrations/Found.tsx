import { Glyph, SettleGroup, STROKE } from "./Glyph";

/**
 * found — anyone founds another.
 * An established pool, then a second, smaller vessel settling in beside it
 * with money of its own. Creation is a transaction, not a company — the
 * new pool is the same shape, arrived last.
 */
const ESTABLISHED = { leftX: 8, rightX: 52, topY: 32, floorY: 76 };
const NEW = { leftX: 58, rightX: 86, topY: 46, floorY: 78 };

/** one open-top U — three stroke-3 lines, the vessel idiom at any size */
function VesselU({ leftX, rightX, topY, floorY }: typeof ESTABLISHED) {
  return (
    <>
      <line
        x1={leftX}
        y1={topY}
        x2={leftX}
        y2={floorY}
        stroke="var(--riprap-diagram-line)"
        strokeWidth={STROKE}
      />
      <line
        x1={leftX}
        y1={floorY}
        x2={rightX}
        y2={floorY}
        stroke="var(--riprap-diagram-line)"
        strokeWidth={STROKE}
      />
      <line
        x1={rightX}
        y1={topY}
        x2={rightX}
        y2={floorY}
        stroke="var(--riprap-diagram-line)"
        strokeWidth={STROKE}
      />
    </>
  );
}

export function Found() {
  return (
    <Glyph label="anyone founds another pool" name="found">
      {/* the established pool */}
      <SettleGroup>
        <VesselU {...ESTABLISHED} />
        <rect x={9.5} y={60.5} width={41} height={14} fill="var(--riprap-funds)" />
      </SettleGroup>
      {/* the new pool — same shape, smaller, arrives last with its own money */}
      <SettleGroup delay={0.12}>
        <VesselU {...NEW} />
        <rect x={59.5} y={68.5} width={25} height={8} fill="var(--riprap-funds)" />
      </SettleGroup>
    </Glyph>
  );
}
