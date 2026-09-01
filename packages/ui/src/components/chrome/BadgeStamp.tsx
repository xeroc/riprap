import type * as React from "react";

import { cn } from "../../lib/utils";

/**
 * `BadgeStamp` — the tag stamp (DESIGN.md § badge-stamp): stamps, never
 * pills. Transparent ground, stone text, mono-label type, 1px hairline
 * border, radius 0, 4×10px padding. Uppercase belongs to mono only.
 */
export function BadgeStamp({ className, ...props }: React.ComponentProps<"span">) {
  return (
    <span
      data-slot="badge-stamp"
      className={cn(
        "inline-flex items-center rounded-none border border-hairline px-2.5 py-1 uppercase tracking-(--riprap-tracking-stamp) text-stone [font:var(--riprap-mono-label)]",
        className,
      )}
      {...props}
    />
  );
}
