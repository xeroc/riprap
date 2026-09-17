import { GlyphClockProvider, HexBackdrop } from "@riprap/ui";
import type { ReactNode } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

/**
 * Scene — the shared full-frame scaffold: hex engineering paper behind,
 * content in a centered column, and the glyph clock wired so every kit
 * illustration in the scene is a pure function of the scene-local frame.
 *
 * Both layers are absolutely positioned on purpose: the nearest positioned
 * ancestor is Remotion's <Sequence> wrapper, a display:flex ROW — an
 * in-flow column would be laid out as a row item (packed left, shrunk to
 * content) instead of filling the frame.
 *
 * Video type scale (DESIGN.md law, staged at 1920×1080): the kit's chrome
 * font vars are web-scaled (mono-label is 12px) — scenes set sizes with
 * utilities only, never `[font:var(--riprap-mono-*)]`. Secondary text is
 * body (#c9cdd1), never muted, at ≥30px.
 */
export function Scene({
  children,
  backdropAnchor = 0.78,
}: {
  children: ReactNode;
  backdropAnchor?: number;
}) {
  const frame = useCurrentFrame();
  const { fps, width, height } = useVideoConfig();
  return (
    <GlyphClockProvider clock={{ frame, fps }}>
      <HexBackdrop
        className="absolute inset-0 h-full w-full"
        width={width}
        height={height}
        anchorX={width * backdropAnchor}
        anchorY={height * 0.6}
      />
      <div className="absolute inset-0 z-10 flex flex-col items-center justify-center gap-14 px-20 text-center">
        {children}
      </div>
    </GlyphClockProvider>
  );
}

/** mono kicker — uppercase is mono-only (AGENTS.md type law) */
export function Kicker({ children }: { children: ReactNode }) {
  return (
    <p className="m-0 font-mono text-3xl uppercase tracking-(--riprap-tracking-stamp) text-body">
      {children}
    </p>
  );
}

/** a numeral on screen — JetBrains Mono always; funds-ink when it is money
 * on the dark ground (AGENTS.md type + color law) */
export function Num({ children, funds = false }: { children: ReactNode; funds?: boolean }) {
  return (
    <span data-num className={funds ? "font-mono text-(--riprap-funds-ink)" : "font-mono"}>
      {children}
    </span>
  );
}
