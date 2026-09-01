import { SvgText } from "../atoms/SvgFrame";

/**
 * Scene chrome per composition.md: scene title top-left (x=40, baseline 64,
 * title 28, ink, bold; optional subtitle at 13 muted, y=88), panels as
 * rounded rects (radius 12, stroke line 3, canvas fill), gutters 40,
 * margin 40.
 */
export function SceneTitle({ title, subtitle }: { title: string; subtitle?: string }) {
  return (
    <g>
      <SvgText x={40} y={64} size={28} fill="var(--riprap-ink)" bold>
        {title}
      </SvgText>
      {subtitle ? (
        <SvgText x={40} y={88} size={13} fill="var(--riprap-muted)">
          {subtitle}
        </SvgText>
      ) : null}
    </g>
  );
}

export interface PanelProps {
  x: number;
  y: number;
  width: number;
  height: number;
  /** numbered panel title, e.g. `1 · claim filed` */
  title?: string;
  /** dashed panel = non-taken branch (the rejected box) */
  dashed?: boolean;
}

export function Panel({ x, y, width, height, title, dashed = false }: PanelProps) {
  return (
    <g>
      <rect
        x={x}
        y={y}
        width={width}
        height={height}
        rx={12}
        fill="var(--riprap-canvas)"
        stroke={dashed ? "var(--riprap-muted)" : "var(--riprap-line)"}
        strokeWidth={3}
        strokeDasharray={dashed ? "10 8" : undefined}
      />
      {title ? (
        <SvgText x={x + 16} y={y + 32} size={18} fill="var(--riprap-ink)" bold>
          {title}
        </SvgText>
      ) : null}
    </g>
  );
}

export interface MonoSegment {
  text: string;
  mono: boolean;
}

const segmentAdvance = (s: MonoSegment, size: number) =>
  Math.round((s.text.length * size * (s.mono ? 0.62 : 0.55)) / 4) * 4;

/**
 * Mixed-font line compositor — the type law's answer to "numbers are
 * monospace" inside running prose. Advance ≈ 0.62em mono / 0.55em Arial,
 * grid-rounded; exactness is not the point, separation is.
 */
export function MonoLine({
  x,
  y,
  size,
  fill,
  segments,
  anchor = "start",
}: {
  x: number;
  y: number;
  size: 44 | 28 | 18 | 16 | 13;
  fill: string;
  segments: MonoSegment[];
  anchor?: "start" | "middle" | "end";
}) {
  const width = segments.reduce((acc, s) => acc + segmentAdvance(s, size), 0);
  let cx = anchor === "start" ? x : anchor === "middle" ? x - width / 2 : x - width;
  return (
    <g>
      {segments.map((s, i) => {
        const el = (
          <SvgText key={i} x={Math.round(cx)} y={y} size={size} fill={fill} mono={s.mono}>
            {s.text}
          </SvgText>
        );
        cx += segmentAdvance(s, size);
        return el;
      })}
    </g>
  );
}
