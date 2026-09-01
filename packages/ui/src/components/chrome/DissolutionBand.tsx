import type * as React from "react";
import { usd } from "../../lib/poolMath";
import { cn } from "../../lib/utils";

/**
 * `DissolutionBand` — post-pool end state ONLY (DESIGN.md § dissolution-band):
 * the deepest ground tone, the mark in its scattered state, `$0 remaining` in
 * mono, and the dissolution line in body-sm. Never on evergreen pages — this
 * is the brand's signature moment.
 */
export interface DissolutionBandProps extends React.ComponentProps<"section"> {
  /** treasury remaining at dissolution — 0 by definition of the end state */
  remaining?: number;
  /** e.g. "Every claim paid. The crank returned the rest. The pool is closed." */
  line: string;
  /** the scattered-mark slot — pass the kit's DissolutionScatter */
  mark?: React.ReactNode;
}

export function DissolutionBand({
  remaining = 0,
  line,
  mark,
  className,
  ...props
}: DissolutionBandProps) {
  return (
    <section
      data-slot="dissolution-band"
      className={cn(
        "border-y border-hairline bg-ground-deep py-(--riprap-space-section)",
        className,
      )}
      {...props}
    >
      <div className="mx-auto flex w-full max-w-(--riprap-content-max) flex-col items-center gap-(--riprap-space-xl) px-4 md:px-6">
        {mark}
        <p data-num className="text-ink [font:var(--riprap-mono-number)]">
          {usd(remaining)} remaining
        </p>
        <p className="max-w-md text-center text-muted-foreground [font:var(--riprap-body-sm)]">
          {line}
        </p>
      </div>
    </section>
  );
}
