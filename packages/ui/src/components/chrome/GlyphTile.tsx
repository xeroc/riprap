import type * as React from "react";

import { cn } from "../../lib/utils";
import { Card } from "../ui/card";
import { PlateTicks } from "./PlateTicks";

/**
 * `GlyphTile` — one concept on a registered plate: the glyph centered on a
 * card, an ordinal in mono (numbers are the hero of the caption), the
 * plain-word label stamped below. Composition unit of the lifecycle strip.
 */
export interface GlyphTileProps {
  /** ordinal, e.g. "01" — mono, data-num */
  step: string;
  /** plain-word concept, e.g. "money gathers" — mono uppercase stamp */
  label: string;
  /** the glyph SVG (one of the kit's illustrations) */
  children: React.ReactNode;
  className?: string;
}

export function GlyphTile({ step, label, children, className }: GlyphTileProps) {
  return (
    <figure data-slot="glyph-tile" className={cn("relative m-0", className)}>
      <PlateTicks />
      <Card className="h-full gap-0 py-0">
        <div className="flex min-h-30 flex-1 items-center justify-center p-6">
          <div className="max-w-16 flex-1">{children}</div>
        </div>
        <figcaption className="flex items-baseline gap-2 border-t border-hairline px-4 py-3">
          <span data-num className="text-muted-soft [font:var(--riprap-mono-label)]">
            {step}
          </span>
          <span className="uppercase tracking-(--riprap-tracking-stamp) text-muted-foreground [font:var(--riprap-mono-label)]">
            {label}
          </span>
        </figcaption>
      </Card>
    </figure>
  );
}
