import { fillHeight, usd } from "../lib/poolMath";
import { MemberStone } from "./MemberStone";
import { SvgText } from "./SvgFrame";

/**
 * Atom: pool-with-level — the vessel and its fill. The single most important
 * atom: every dollar in the system is inside this shape or visibly leaving it.
 * meta/primitives/atoms/pool-with-level.md.
 *
 * Data bindings: treasury balance → fill AREA (constant interior width ⇒ fill
 * height linear in USDC); dashed level line + `$X` label; exactly two door
 * gaps (spending / liquidation) — never a third exit.
 *
 * Geometry (composition.md): open-top U, interior 360×260 default, walls 3px.
 * Scenes may scale proportionally (width:height ≈ 1.4) — stroke stays 3.
 */
export interface PoolVesselProps {
  /** treasury USDC balance */
  balance: number;
  /** max balance on this piece's shared money scale (area = money contract) */
  maxBalance: number;
  /** grid-aligned top-left of the vessel */
  x: number;
  y: number;
  /** interior width — composition.md: scale proportionally for thumbnails */
  interiorWidth?: number;
  /** wall height (keep width:height ≈ 1.4) */
  wallHeight?: number;
  /** door states — shut by default; open only when money moves through them */
  spendingDoor?: "open" | "shut";
  liquidationDoor?: "open" | "shut";
  /** member stones resting on the fill surface (member-facing scenes) */
  surfaceStones?: number;
  /** dashed level line + `$X` label (the atom's one required annotation) */
  showLevelLine?: boolean;
}

export const VESSEL_INTERIOR_W = 360;
export const VESSEL_WALL_H = 260;
const STROKE = 3;

export function PoolVessel({
  balance,
  maxBalance,
  x,
  y,
  interiorWidth = VESSEL_INTERIOR_W,
  wallHeight = VESSEL_WALL_H,
  spendingDoor = "shut",
  liquidationDoor = "shut",
  surfaceStones = 0,
  showLevelLine = true,
}: PoolVesselProps) {
  const level = Math.round(fillHeight(balance, maxBalance, wallHeight - 16) / 4) * 4;
  const fillY = y + wallHeight - level;
  const wallL = x;
  const wallR = x + interiorWidth;
  const bottom = y + wallHeight;
  const doorW = interiorWidth >= 360 ? 48 : 32;
  const liqStart = x + interiorWidth / 2 - doorW / 2;
  const liqEnd = x + interiorWidth / 2 + doorW / 2;
  const spendTop = bottom - doorW - 24; // spending gap: right wall, lower half

  return (
    <g>
      {/* fill first (behind walls) — solid funds, one flat tone, never a gradient */}
      {level > 0 ? (
        <rect
          x={wallL + STROKE}
          y={fillY}
          width={interiorWidth - STROKE * 2}
          height={level}
          fill="var(--riprap-funds)"
        />
      ) : null}

      {/* vessel: left wall → bottom (liquidation gap) → right wall (spending gap) */}
      <path
        d={`M ${wallL} ${y} V ${bottom} H ${liqStart} M ${liqEnd} ${bottom} H ${wallR} V ${spendTop}`}
        fill="none"
        stroke="var(--riprap-diagram-ink)"
        strokeWidth={STROKE}
      />
      {/* right wall below the spending gap */}
      <line
        x1={wallR}
        y1={spendTop + doorW}
        x2={wallR}
        y2={bottom}
        stroke="var(--riprap-diagram-ink)"
        strokeWidth={STROKE}
      />

      {/* gate glyphs on the two doors — deliberation color */}
      <GateGlyph
        x={wallR}
        y={spendTop + doorW / 2}
        orientation="right"
        open={spendingDoor === "open"}
      />
      <GateGlyph
        x={x + interiorWidth / 2}
        y={bottom}
        orientation="bottom"
        open={liquidationDoor === "open"}
      />
      {interiorWidth >= 360 ? (
        <SvgText
          x={wallR + 12}
          y={spendTop + doorW / 2 - 12}
          size={13}
          fill="var(--riprap-deliberation)"
        >
          spending — adjudicated
        </SvgText>
      ) : (
        /* thumbnails: short label under the right wall — the full 140px
           phrase at the door collides with every neighboring annotation */
        <SvgText x={wallR + 20} y={bottom + 24} size={13} fill="var(--riprap-deliberation)">
          spending
        </SvgText>
      )}
      <SvgText
        x={x + interiorWidth / 2}
        y={bottom + 24}
        size={13}
        fill="var(--riprap-deliberation)"
        anchor="middle"
      >
        liquidation
      </SvgText>

      {/* dashed level line + balance label */}
      {showLevelLine && level > 0 ? (
        <>
          <line
            x1={wallL + STROKE}
            y1={fillY}
            x2={wallR + (interiorWidth >= 360 ? 64 : 36)}
            y2={fillY}
            stroke="var(--riprap-funds)"
            strokeWidth={STROKE}
            strokeDasharray="8 6"
          />
          {interiorWidth >= 360 ? (
            <SvgText x={wallR + 68} y={fillY + 5} size={16} fill="var(--riprap-funds-ink)" mono>
              {usd(balance)}
            </SvgText>
          ) : (
            /* thumbnails: start-anchored past the line end — a right-aligned
               label lands under the surface stones */
            <SvgText x={wallR + 36} y={fillY + 4} size={16} fill="var(--riprap-funds-ink)" mono>
              {usd(balance)}
            </SvgText>
          )}
        </>
      ) : null}

      {/* stones at surface — members ride on their money */}
      {Array.from({ length: surfaceStones }, (_, i) => (
        <MemberStone
          key={i}
          size={i % 3 === 0 ? "M" : "S"}
          seed={100 + i}
          x={wallL + 40 + (i * (interiorWidth - 80)) / (surfaceStones > 1 ? surfaceStones - 1 : 1)}
          y={fillY - 16}
        />
      ))}
    </g>
  );
}

/** Door gate: shut = solid bar across the gap; open = swung ajar out of the money's way. */
export function GateGlyph({
  x,
  y,
  orientation,
  open,
}: {
  x: number;
  y: number;
  orientation: "right" | "bottom";
  open: boolean;
}) {
  const r = 10;
  const transform =
    orientation === "right" ? `translate(${x + 4} ${y})` : `translate(${x} ${y + 4})`;
  const line =
    orientation === "right"
      ? open
        ? { x1: 0, y1: 0, x2: -r, y2: -r }
        : { x1: 0, y1: -r, x2: 0, y2: r }
      : open
        ? { x1: 0, y1: 0, x2: r, y2: -r }
        : { x1: -r, y1: 0, x2: r, y2: 0 };
  return (
    <g transform={transform}>
      <line
        x1={line.x1}
        y1={line.y1}
        x2={line.x2}
        y2={line.y2}
        stroke="var(--riprap-deliberation)"
        strokeWidth={3}
      />
    </g>
  );
}
