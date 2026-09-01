import type * as React from "react";
import { usd } from "../../lib/poolMath";
import { cn } from "../../lib/utils";
import { Card } from "../ui/card";

/**
 * `TierCard` — coverage tier card (DESIGN.md § tier-card), on the shadcn Card
 * shell. Numbers are the hero: entry fee and max payout in mono-number-lg,
 * tier name in mono-label. No illustration inside — the card IS the plate.
 *
 * Data law: fee/cap arrive as props — provenance is the policy tier table
 * (only allowed prices: $10/$20/$40 fees, $1,000/$2,000/$4,000 caps). The cap
 * prints with its ceiling wording ("up to") per DESIGN.md § Don'ts.
 */
export interface TierCardProps extends React.ComponentProps<"div"> {
  /** tier name, e.g. "Standard" */
  name: string;
  /** entry fee in USDC (policy §5) */
  fee: number;
  /** maximum payout in USDC (policy §5) */
  cap: number;
  /** optional closing line, e.g. the coverage scope */
  footnote?: string;
}

export function TierCard({ name, fee, cap, footnote, className, ...props }: TierCardProps) {
  return (
    <Card data-slot="tier-card" className={cn("gap-6 p-8", className)} {...props}>
      <h3 className="uppercase tracking-(--riprap-tracking-stamp) text-muted-foreground [font:var(--riprap-mono-label)]">
        {name}
      </h3>
      <div className="flex flex-col gap-2">
        <span className="uppercase tracking-(--riprap-tracking-stamp) text-muted-soft [font:var(--riprap-mono-label)]">
          entry fee
        </span>
        <span data-num className="text-ink [font:var(--riprap-mono-number-lg)]">
          {usd(fee)}
        </span>
      </div>
      <div className="h-px w-full bg-hairline" aria-hidden="true" />
      <div className="flex flex-col gap-2">
        <span className="uppercase tracking-(--riprap-tracking-stamp) text-muted-soft [font:var(--riprap-mono-label)]">
          max payout
        </span>
        <span data-num className="text-ink [font:var(--riprap-mono-number-lg)]">
          up to {usd(cap)}
        </span>
      </div>
      {footnote && <p className="text-muted-foreground [font:var(--riprap-body-sm)]">{footnote}</p>}
    </Card>
  );
}
