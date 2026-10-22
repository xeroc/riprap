import { Glyph, SettleGroup, STROKE } from "./Glyph";

/**
 * filed — a payout request is filed.
 * The claim-filed atom at glyph scale: the request paper, the pool holding
 * its level, and one funds arrow from paper to pool — the claim on the
 * money, pointed at it (claim-filed: "a funds arrow from the incident
 * cluster toward the pool"). No peril mark here: the platform story files
 * a request, not an incident.
 */
const PAPER = { x: 8, y: 24, w: 34, h: 46 };
const ROW = { x1: 14, x2: 36, ys: [34, 42, 50] };
const VESSEL = { leftX: 56, rightX: 90, topY: 30, floorY: 72 };
const LEVEL = { height: 20 };
const ARROW = { y: 51, shaft: { x1: 44, x2: 54 }, head: "M54 51 l-6 -4.5 M54 51 l-6 4.5" };

/** the vessel outline as three lines (left wall, floor, right wall) */
function VesselLines() {
  const { leftX, rightX, topY, floorY } = VESSEL;
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

export function Filed() {
  const level = {
    x: VESSEL.leftX + 1.5,
    width: VESSEL.rightX - VESSEL.leftX - 3,
    y: VESSEL.floorY - 1.5 - LEVEL.height,
    height: LEVEL.height,
  };
  return (
    <Glyph label="a payout request is filed" name="filed">
      {/* the pool, holding its level */}
      <SettleGroup>
        <VesselLines />
        <rect
          x={level.x}
          y={level.y}
          width={level.width}
          height={level.height}
          fill="var(--riprap-funds)"
        />
      </SettleGroup>
      {/* the request paper */}
      <SettleGroup delay={0.08}>
        <rect
          x={PAPER.x}
          y={PAPER.y}
          width={PAPER.w}
          height={PAPER.h}
          fill="none"
          stroke="var(--riprap-diagram-line)"
          strokeWidth={STROKE}
        />
        {ROW.ys.map((y) => (
          <line
            key={y}
            x1={ROW.x1}
            y1={y}
            x2={ROW.x2}
            y2={y}
            stroke="var(--riprap-diagram-line)"
            strokeWidth={2}
          />
        ))}
      </SettleGroup>
      {/* the claim on the money — funds arrow, arrives last */}
      <SettleGroup delay={0.2}>
        <line
          x1={ARROW.shaft.x1}
          y1={ARROW.y}
          x2={ARROW.shaft.x2}
          y2={ARROW.y}
          stroke="var(--riprap-funds)"
          strokeWidth={STROKE}
        />
        <path d={ARROW.head} fill="none" stroke="var(--riprap-funds)" strokeWidth={STROKE} />
      </SettleGroup>
    </Glyph>
  );
}
