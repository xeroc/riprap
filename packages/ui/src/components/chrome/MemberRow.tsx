import type * as React from "react";

import { cn } from "../../lib/utils";

/**
 * `MemberRow` — one member in a pool's member list (DESIGN.md: the avatar
 * disc is the only circle; rows are hairline-divided, never pills). The
 * handle renders in mono (every identifier is mono); the status is a plain
 * word stamp ("in", "drawn"…).
 *
 * Data law: handle/status arrive as props and render verbatim — the row
 * invents nothing, and never shows an amount (platform register).
 */
export interface MemberRowProps extends React.ComponentProps<"div"> {
  /** member handle — mono, verbatim */
  handle: string;
  /** disc initial — one or two characters, verbatim */
  initial: string;
  /** status word, e.g. "in" — mono stamp */
  status?: string;
}

export function MemberRow({ handle, initial, status, className, ...props }: MemberRowProps) {
  return (
    <div
      data-slot="member-row"
      className={cn(
        "flex items-center gap-5 border-b border-hairline px-6 py-4 last:border-b-0",
        className,
      )}
      {...props}
    >
      <span
        aria-hidden="true"
        className="flex size-10 shrink-0 items-center justify-center rounded-full border border-hairline-strong bg-surface-strong text-stone [font:var(--riprap-mono-label)]"
      >
        {initial}
      </span>
      <span data-num className="flex-1 text-ink [font:var(--riprap-mono-number)]">
        {handle}
      </span>
      {status ? (
        <span className="uppercase tracking-(--riprap-tracking-stamp) text-muted-foreground [font:var(--riprap-mono-label)]">
          {status}
        </span>
      ) : null}
    </div>
  );
}
