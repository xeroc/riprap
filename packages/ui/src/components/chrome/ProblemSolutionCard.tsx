import type * as React from "react";

import { numeralSegments } from "../../lib/numeral";
import { cn } from "../../lib/utils";
import { Card } from "../ui/card";

/**
 * `ProblemSolutionCard` — one investor question split across two bands
 * (DESIGN.md § Cards + § Elevation & Depth): the problem sits on the card
 * ground in muted body under a stone stamp; a 1px hairline rule; the
 * solution takes the plate tone step (surface-strong), ink-weighted text
 * and a harbor-blue stamp. The solution is the emphasized half — depth is
 * tone + hairline only, never a shadow. Numerals inside the prose render
 * mono per DESIGN.md § Typography (`numeralSegments`, marked `data-num`).
 *
 * Data law: question/answer arrive as props, verbatim copy — this
 * component never edits, summarizes, or invents content. Width is the
 * consumer's call (`className`, e.g. "w-80").
 */
export interface ProblemSolutionCardProps extends React.ComponentProps<"div"> {
  /** the question, verbatim (e.g. from apps/pitch-seed-raise/PROBLEMS.md) */
  question: string;
  /** the proposed answer, verbatim */
  answer: string;
  /** mono ordinal, e.g. "05" — renders right-aligned in the problem band */
  index?: string;
}

/** prose with its numeral runs set in JetBrains Mono, marked data-num */
function numerals(text: string): React.ReactNode {
  return numeralSegments(text).map((segment, i) =>
    segment.numeral ? (
      // biome-ignore lint/suspicious/noArrayIndexKey: segments derive positionally from an immutable string split
      <span key={i} data-num className="font-mono">
        {segment.text}
      </span>
    ) : (
      // biome-ignore lint/suspicious/noArrayIndexKey: segments derive positionally from an immutable string split
      <span key={i}>{segment.text}</span>
    ),
  );
}

export function ProblemSolutionCard({
  question,
  answer,
  index,
  className,
  ...props
}: ProblemSolutionCardProps) {
  return (
    <Card data-slot="problem-solution-card" className={cn("gap-0 p-0", className)} {...props}>
      <div data-slot="ps-problem" className="flex flex-1 flex-col gap-3 p-2">
        <div className="flex items-center justify-between gap-4">
          <span className="inline-flex items-center px-2.5 py-1 text-stone">
            <p className="text-muted-foreground [font:var(--riprap-body-md)]">
              {numerals(question)}
            </p>
          </span>
          {index ? (
            <span data-num className="text-muted-soft [font:var(--riprap-mono-label)]">
              {index}
            </span>
          ) : null}
        </div>
      </div>
      <div
        data-slot="ps-solution"
        className="flex flex-1 flex-col gap-3 border-t border-hairline bg-strong p-6"
      >
        <p>{numerals(answer)}</p>
      </div>
    </Card>
  );
}
