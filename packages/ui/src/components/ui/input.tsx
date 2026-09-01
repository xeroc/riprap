import type * as React from "react";

import { cn } from "../../lib/utils";

/*
 * DESIGN.md § text-input — card ground, 1px hairline-strong border, radius 2px
 * (the only non-zero chrome radius), 12×16px padding, 44px height. On focus the
 * edge thickens to 2px stone: drawn as a 2px outline over the hairline so
 * nothing shifts. Settle colors only — no opacity fades.
 */
function Input({ className, type, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type={type}
      data-slot="input"
      className={cn(
        "h-11 w-full min-w-0 rounded-input border border-hairline-strong bg-card px-4 py-3 text-base text-ink transition-[border-color,color] duration-[160ms] ease-out outline-none placeholder:text-muted-soft focus-visible:border-stone focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-stone disabled:cursor-not-allowed disabled:border-hairline-soft disabled:text-muted-soft aria-invalid:border-error aria-invalid:focus-visible:outline-error file:inline-flex file:h-7 file:border-0 file:bg-transparent file:text-sm file:font-medium file:text-ink md:text-sm",
        className,
      )}
      {...props}
    />
  );
}

export { Input };
