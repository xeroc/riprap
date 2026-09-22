import type * as React from "react";

import { cn } from "../../lib/utils";

/*
 * DESIGN.md § text-input — same law as Input (card ground, 1px
 * hairline-strong border, radius 2px, settle focus to a 2px stone outline),
 * multi-line: auto min-height, top-aligned text, manual resize.
 */
function Textarea({ className, ...props }: React.ComponentProps<"textarea">) {
  return (
    <textarea
      data-slot="textarea"
      className={cn(
        "flex min-h-24 w-full rounded-input border border-hairline-strong bg-card px-4 py-3 text-base text-ink transition-[border-color,color] duration-[160ms] ease-out outline-none placeholder:text-muted-soft focus-visible:border-stone focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-stone disabled:cursor-not-allowed disabled:border-hairline-soft disabled:text-muted-soft aria-invalid:border-error aria-invalid:focus-visible:outline-error md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Textarea };
