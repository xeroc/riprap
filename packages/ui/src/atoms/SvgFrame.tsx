import type { ReactNode } from "react";

/**
 * SVG frame per meta/primitives ground rules: viewBox sized to content,
 * xmlns on root, title/desc with role="img" + aria-labelledby, one palette,
 * one stroke width, no filters, no emoji.
 */
export interface SvgFrameProps {
  width: number;
  height: number;
  title: string;
  desc?: string;
  /** paint the canvas background token (default true) */
  canvas?: boolean;
  children: ReactNode;
}

let uid = 0;

export function SvgFrame({ width, height, title, desc, canvas = true, children }: SvgFrameProps) {
  const id = `riprap-${++uid}`;
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox={`0 0 ${width} ${height}`}
      width={width}
      height={height}
      role="img"
      aria-labelledby={`${id}-title${desc ? ` ${id}-desc` : ""}`}
    >
      <title id={`${id}-title`}>{title}</title>
      {desc ? <desc id={`${id}-desc`}>{desc}</desc> : null}
      {canvas ? (
        <rect x={0} y={0} width={width} height={height} fill="var(--riprap-canvas)" />
      ) : null}
      {children}
    </svg>
  );
}

/** Shared text helper — explicit size + fill on every text (skill rule). */
export function SvgText({
  x,
  y,
  size,
  fill,
  mono = false,
  bold = false,
  anchor = "start",
  children,
}: {
  x: number;
  y: number;
  size: 44 | 28 | 18 | 16 | 13;
  fill: string;
  mono?: boolean;
  bold?: boolean;
  anchor?: "start" | "middle" | "end";
  children: string;
}) {
  return (
    <text
      x={x}
      y={y}
      fontSize={size}
      fill={fill}
      fontWeight={bold ? "bold" : "normal"}
      fontFamily={mono ? "var(--riprap-font-mono)" : "var(--riprap-font-prose)"}
      textAnchor={anchor}
    >
      {children}
    </text>
  );
}
