import type { StoneSize } from "../lib/stone";
import { MemberStone } from "./MemberStone";
import { SvgText } from "./SvgFrame";
import { VesselOutline } from "./VesselOutline";

/**
 * Atom: dissolution — the ending that is a feature: the pile disperses, the
 * vessel empties, nothing survives. meta/primitives/atoms/dissolution.md.
 *
 * Dash is the visual past tense (50% opacity, no fill); stones leave with
 * motion ticks — the only atoms that get them; `$0` printed at the floor.
 * No rubble, no cracks: orderly settlement, not collapse.
 */
export interface DissolutionProps {
  x: number;
  y: number;
  interiorWidth?: number;
  wallHeight?: number;
  /** dispersing stone count (5–8, mirror the membership) */
  stoneCount?: number;
  seed?: number;
}

/** Dispersal vectors — never uniform (dispersal is not formation run backwards). */
const SCATTER: { dx: number; dy: number; size: StoneSize }[] = [
  { dx: -0.9, dy: -0.7, size: "S" },
  { dx: -0.4, dy: -1.1, size: "M" },
  { dx: 0.5, dy: -0.9, size: "S" },
  { dx: 1.0, dy: -0.5, size: "M" },
  { dx: -1.2, dy: 0.2, size: "S" },
  { dx: 1.2, dy: 0.3, size: "S" },
  { dx: -0.6, dy: 0.6, size: "M" },
  { dx: 0.8, dy: 0.7, size: "S" },
];

/**
 * Motion ticks — short trailing strokes behind a dispersing stone.
 * Tension convention (composition.md): ONLY dispersing stones get ticks.
 */
export function StoneTicks({ x, y, dx, dy }: { x: number; y: number; dx: number; dy: number }) {
  const back = { x: x - dx * 20, y: y - dy * 20 };
  const perp = { x: dy * 8, y: -dx * 8 };
  return (
    <g>
      {[0, 1, 2].map((i) => {
        const t = 0.3 + i * 0.28;
        const cx = x + (back.x - x) * t;
        const cy = y + (back.y - y) * t;
        return (
          <line
            key={i}
            x1={cx - perp.x}
            y1={cy - perp.y}
            x2={cx + perp.x}
            y2={cy + perp.y}
            stroke="var(--riprap-muted)"
            strokeWidth={3}
          />
        );
      })}
    </g>
  );
}

export function Dissolution({
  x,
  y,
  interiorWidth = 176,
  wallHeight = 128,
  stoneCount = 6,
  seed = 42,
}: DissolutionProps) {
  const n = Math.min(8, Math.max(5, stoneCount));
  const radius = interiorWidth * 0.72;
  const bottom = y + wallHeight;

  return (
    <g>
      {/* the vessel visible-but-dashed — "this is where it happened" */}
      <VesselOutline
        x={x}
        y={y}
        width={interiorWidth}
        height={wallHeight}
        dashed
        strokeOpacity={0.5}
        doors
      />

      {/* balance at its floor */}
      <SvgText
        x={x + interiorWidth / 2}
        y={y + wallHeight / 2}
        size={16}
        fill="var(--riprap-muted)"
        mono
        anchor="middle"
      >
        $0
      </SvgText>

      {/* dispersing stones — outside and away, unhurried, ticked */}
      {SCATTER.slice(0, n).map((s, i) => {
        const sx = x + interiorWidth / 2 + s.dx * radius;
        const sy = y + wallHeight / 2 + s.dy * radius * 0.8;
        const norm = Math.hypot(s.dx, s.dy) || 1;
        return (
          <g key={i}>
            <StoneTicks x={sx} y={sy} dx={s.dx / norm} dy={s.dy / norm} />
            <MemberStone size={s.size} seed={seed + i} x={sx} y={sy} />
          </g>
        );
      })}

      {/* finality — one line, no softening */}
      <SvgText
        x={x + interiorWidth / 2}
        y={bottom + 32}
        size={13}
        fill="var(--riprap-muted)"
        anchor="middle"
      >
        dissolved — nothing survives
      </SvgText>
    </g>
  );
}
