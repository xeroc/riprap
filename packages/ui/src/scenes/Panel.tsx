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
      <MonoLine
        x={40}
        y={64}
        size={28}
        fill="var(--riprap-diagram-ink)"
        bold
        segments={numeralSegments(title)}
      />
      {subtitle ? (
        <MonoLine
          x={40}
          y={88}
          size={13}
          fill="var(--riprap-diagram-muted)"
          segments={numeralSegments(subtitle)}
        />
      ) : null}
    </g>
  );
}

export interface PanelProps {
  x: number;
  y: number;
  width: number;
  height: number;
  /** numbered panel title, e.g. `1 · claim filed` — the numeral renders mono */
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
        fill="var(--riprap-diagram-canvas)"
        stroke={dashed ? "var(--riprap-diagram-muted)" : "var(--riprap-diagram-line)"}
        strokeWidth={3}
        strokeDasharray={dashed ? "10 8" : undefined}
      />
      {title ? (
        <MonoLine
          x={x + 16}
          y={y + 32}
          size={18}
          fill="var(--riprap-diagram-ink)"
          bold
          segments={numeralSegments(title)}
        />
      ) : null}
    </g>
  );
}

export interface MonoSegment {
  text: string;
  mono: boolean;
}

/**
 * Split a mixed line into prose/mono segments so every numeral —
 * `$12,000`, `1:100`, `42` — renders in JetBrains Mono, inline in prose
 * too (DESIGN.md type law). Idempotent for digit-free lines.
 */
export function numeralSegments(text: string): MonoSegment[] {
  return text
    .split(/(\$?\d[\d,]*(?:\.\d+)?)/)
    .filter(Boolean)
    .map((part) => ({ text: part, mono: /\d/.test(part) }));
}

const segmentAdvance = (s: MonoSegment, size: number) =>
  Math.round((s.text.length * size * (s.mono ? 0.62 : 0.55)) / 4) * 4;

/**
 * Mixed-font line compositor — the type law's answer to "numbers are
 * monospace" inside running prose. Advance ≈ 0.62em mono / 0.55em prose,
 * grid-rounded; exactness is not the point, separation is. `bold` sets the
 * display treatment on the prose segments (Space Grotesk 700, −0.03em).
 */
export function MonoLine({
  x,
  y,
  size,
  fill,
  segments,
  bold = false,
  anchor = "start",
}: {
  x: number;
  y: number;
  size: 44 | 28 | 18 | 16 | 13;
  fill: string;
  segments: MonoSegment[];
  bold?: boolean;
  anchor?: "start" | "middle" | "end";
}) {
  const width = segments.reduce((acc, s) => acc + segmentAdvance(s, size), 0);
  let cx = anchor === "start" ? x : anchor === "middle" ? x - width / 2 : x - width;
  return (
    <g>
      {segments.map((s, i) => {
        const el = (
          <SvgText
            key={i}
            x={Math.round(cx)}
            y={y}
            size={size}
            fill={fill}
            mono={s.mono}
            bold={bold}
          >
            {s.text}
          </SvgText>
        );
        cx += segmentAdvance(s, size);
        return el;
      })}
    </g>
  );
}
