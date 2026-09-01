import type * as React from "react";

import { cn } from "../../lib/utils";

/**
 * `StampBadge` — the instance lockup stamp (DESIGN.md § stamp-badge):
 * uppercase JetBrains Mono in harbor-blue, 1px hairline-strong border,
 * radius 0, 6×12px padding. Pattern: `: BLADE POOL @ BREAKPOINT`.
 * Mirrors the logo's instance stamp.
 */
export interface StampBadgeProps extends React.ComponentProps<"span"> {
  /** pool instance name, e.g. "Blade Pool" — uppercased on render */
  pool: string;
  /** event binding, e.g. "Breakpoint" — uppercased on render */
  event?: string;
}

export function StampBadge({ pool, event, className, ...props }: StampBadgeProps) {
  const text = `: ${pool.toUpperCase()}${event ? ` @ ${event.toUpperCase()}` : ""}`;
  return (
    <span
      data-slot="stamp-badge"
      className={cn(
        "inline-flex items-center rounded-none border border-hairline-strong px-3 py-1.5 uppercase tracking-(--riprap-tracking-stamp) text-(--riprap-accent) [font:var(--riprap-mono-label)]",
        className,
      )}
      {...props}
    >
      {text}
    </span>
  );
}
