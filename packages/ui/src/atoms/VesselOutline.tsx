import { GateGlyph } from "./PoolVessel";
import { SvgText } from "./SvgFrame";

/**
 * Empty vessel outline for atoms that need the pool geometry without a fill
 * (sponsor-founds' quiet basin, pro-rata-refund's sliced remainder,
 * dissolution's dashed past tense). Same U-family as PoolVessel: open top,
 * stroke 3, at most the two governed door gaps — never a third exit.
 */
export interface VesselOutlineProps {
  x: number;
  y: number;
  /** interior width */
  width: number;
  /** wall height (keep width:height ≈ 1.4) */
  height: number;
  /** dashed stroke = past tense (dissolution) */
  dashed?: boolean;
  /** stroke opacity — sponsor's basin reads "not yet live" at 0.6 */
  strokeOpacity?: number;
  /** cut the two governed door gaps into the walls */
  doors?: boolean;
  /** gate glyphs + labels on the doors (required whenever the vessel holds money) */
  doorGates?: { spending?: "open" | "shut"; liquidation?: "open" | "shut" } | false;
}

export function VesselOutline({
  x,
  y,
  width,
  height,
  dashed = false,
  strokeOpacity = 1,
  doors = false,
  doorGates = false,
}: VesselOutlineProps) {
  const bottom = y + height;
  const wallR = x + width;
  const doorW = width >= 360 ? 48 : 32;
  const liqStart = x + width / 2 - doorW / 2;
  const liqEnd = x + width / 2 + doorW / 2;
  const spendTop = bottom - doorW - 24;
  const dash = dashed ? "8 8" : undefined;

  const walls = doors
    ? `M ${x} ${y} V ${bottom} H ${liqStart} M ${liqEnd} ${bottom} H ${wallR} V ${spendTop}`
    : `M ${x} ${y} V ${bottom} H ${wallR} V ${y}`;

  return (
    <g>
      <path
        d={walls}
        fill="none"
        stroke="var(--riprap-diagram-ink)"
        strokeWidth={3}
        strokeOpacity={strokeOpacity}
        strokeDasharray={dash}
      />
      {doors ? (
        <line
          x1={wallR}
          y1={spendTop + doorW}
          x2={wallR}
          y2={bottom}
          stroke="var(--riprap-diagram-ink)"
          strokeWidth={3}
          strokeOpacity={strokeOpacity}
          strokeDasharray={dash}
        />
      ) : null}
      {doorGates ? (
        <>
          <GateGlyph
            x={wallR}
            y={spendTop + doorW / 2}
            orientation="right"
            open={doorGates.spending === "open"}
          />
          <GateGlyph
            x={x + width / 2}
            y={bottom}
            orientation="bottom"
            open={doorGates.liquidation === "open"}
          />
          {width >= 360 ? (
            <SvgText
              x={wallR + 12}
              y={spendTop + doorW / 2 - 12}
              size={13}
              fill="var(--riprap-deliberation)"
            >
              spending — adjudicated
            </SvgText>
          ) : (
            <SvgText x={wallR + 20} y={bottom + 24} size={13} fill="var(--riprap-deliberation)">
              spending
            </SvgText>
          )}
          <SvgText
            x={x + width / 2}
            y={bottom + 24}
            size={13}
            fill="var(--riprap-deliberation)"
            anchor="middle"
          >
            liquidation
          </SvgText>
        </>
      ) : null}
    </g>
  );
}
