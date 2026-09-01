/**
 * Connector — composition.md § Anchors and connectors: 3px lines in the
 * meaning's color (money moves on `funds`, adjudication on `deliberation`),
 * arrowheads via a shared marker def, orthogonal or straight runs only.
 */
export interface ArrowProps {
  x1: number;
  y1: number;
  x2: number;
  y2: number;
  /** semantic token the line carries — var(--riprap-*) only */
  color: string;
  /** dashed = limit / non-taken branch; actual moves are solid */
  dashed?: boolean;
  /** arrowhead at both ends (bidirectional, e.g. `unstake anytime`) */
  both?: boolean;
  /** polyline midpoints for orthogonal runs ( composition.md: never diagonal-freehand) */
  via?: { x: number; y: number }[];
}

let markerUid = 0;

export function Arrow({
  x1,
  y1,
  x2,
  y2,
  color,
  dashed = false,
  both = false,
  via = [],
}: ArrowProps) {
  const id = `riprap-arr-${++markerUid}`;
  const points = [{ x: x1, y: y1 }, ...via, { x: x2, y: y2 }];
  const d = points.map((p, i) => `${i === 0 ? "M" : "L"} ${p.x} ${p.y}`).join(" ");
  return (
    <g>
      <defs>
        <marker id={id} markerWidth="8" markerHeight="8" refX="7" refY="4" orient="auto">
          <path d="M0,0 L8,4 L0,8 Z" fill={color} />
        </marker>
      </defs>
      <path
        d={d}
        fill="none"
        stroke={color}
        strokeWidth={3}
        strokeDasharray={dashed ? "8 6" : undefined}
        markerEnd={`url(#${id})`}
        markerStart={both ? `url(#${id})` : undefined}
      />
    </g>
  );
}
