import type * as React from "react";

import { cn } from "../../lib/utils";
import { Card } from "../ui/card";
import { BadgeStamp } from "./BadgeStamp";

/**
 * `PoolCard` — one mutual on the platform register (category surface:
 * numberless by AGENTS.md category-vs-instance law). The risk word is the
 * stamp, the group's name is the display line — no prices, no caps, no
 * dates; those are instance terms this card never carries.
 *
 * Data law: name/risk/footnote arrive as props and render verbatim; the
 * card invents nothing. The `state` stamp mirrors the lifecycle register
 * (open / settled / dissolved) as a plain word prop.
 */
export interface PoolCardProps extends React.ComponentProps<"div"> {
  /** the group's name, e.g. "harbor fishing crew" — display type */
  name: string;
  /** the defined risk, e.g. "lost haul" — renders as the mono stamp */
  risk: string;
  /** lifecycle word, e.g. "open" — mono stamp right of the risk */
  state?: string;
  /** optional closing line under the hairline */
  footnote?: string;
}

export function PoolCard({ name, risk, state, footnote, className, ...props }: PoolCardProps) {
  return (
    <Card data-slot="pool-card" className={cn("gap-6 p-8", className)} {...props}>
      <div className="flex items-start justify-between gap-4">
        <BadgeStamp>{risk}</BadgeStamp>
        {state ? (
          <span
            data-num
            className="m-0 uppercase tracking-(--riprap-tracking-stamp) text-stone [font:var(--riprap-mono-label)]"
          >
            {state}
          </span>
        ) : null}
      </div>
      <h3 className="text-ink [font:var(--riprap-display-sm)]">{name}</h3>
      <div className="h-px w-full bg-hairline" aria-hidden="true" />
      {footnote ? (
        <p className="m-0 text-muted-foreground [font:var(--riprap-body-sm)]">{footnote}</p>
      ) : null}
    </Card>
  );
}
