import { Label as LabelPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "../../lib/utils";

/*
 * Form labels are section labels: uppercase JetBrains Mono (DESIGN.md —
 * uppercase belongs to mono only).
 */
function Label({ className, ...props }: React.ComponentProps<typeof LabelPrimitive.Root>) {
  return (
    <LabelPrimitive.Root
      data-slot="label"
      className={cn(
        "flex items-center gap-2 uppercase tracking-(--riprap-tracking-stamp) text-muted-foreground [font:var(--riprap-mono-label)] select-none group-data-[disabled=true]:pointer-events-none group-data-[disabled=true]:text-muted-soft peer-disabled:cursor-not-allowed peer-disabled:text-muted-soft",
        className,
      )}
      {...props}
    />
  );
}

export { Label };
