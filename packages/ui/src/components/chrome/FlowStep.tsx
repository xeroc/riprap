import type { ComponentType, ReactNode } from "react";

import { cn } from "../../lib/utils";

/**
 * `FlowStep` — one step of a flow: a lifecycle glyph where the ordinal
 * column sits, the headline prefixed by its accent mono ordinal, one body
 * block. The ruled-row anatomy the landing's mechanism band uses across
 * its flows. Data-bound: the glyph, ordinal, and copy come in as props;
 * nothing is invented here.
 */
export interface FlowStepProps {
  /** a zero-prop kit glyph (the step's concept) */
  Glyph: ComponentType;
  /** ordinal, e.g. "01" — mono, accent, data-num */
  step: string;
  /** the step's headline */
  headline: string;
  /** the step's body text */
  children: ReactNode;
  className?: string;
}

export function FlowStep({ Glyph, step, headline, children, className }: FlowStepProps) {
  return (
    <div
      data-slot="flow-step"
      className={cn(
        "grid gap-4 border-b border-hairline py-8 sm:grid-cols-[3.5rem_1fr] sm:gap-10",
        className,
      )}
    >
      {/* the glyph — decorative here: the headline carries the meaning */}
      <div aria-hidden="true" className="w-14">
        <Glyph />
      </div>
      <div>
        <h3 className="flex items-baseline gap-3 tracking-tight text-ink [font:var(--riprap-display-sm)]">
          <span data-num className="font-mono text-base text-accent">
            {step}
          </span>
          {headline}
        </h3>
        <p className="mt-3 max-w-2xl leading-relaxed text-body [font:var(--riprap-body-md)]">
          {children}
        </p>
      </div>
    </div>
  );
}
