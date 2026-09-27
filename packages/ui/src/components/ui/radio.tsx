import type * as React from "react";

import { cn } from "../../lib/utils";

/*
 * DESIGN.md § forms — a native radio, restyled to the checkbox's law:
 * hairline box on card ground, radius 2px, stone fill when selected,
 * settle color change only (no scale/bounce). Native input (keyboard +
 * group semantics for free); the filled square is the station — no check
 * glyph, no color literal escapes tokens.css.
 */
function Radio({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <input
      type="radio"
      data-slot="radio"
      className={cn(
        "size-[18px] appearance-none checked:border-stone checked:bg-stone checked:hover:border-stone cursor-pointer rounded-input border border-hairline-strong bg-card transition-colors duration-[160ms] ease-out focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-stone disabled:cursor-not-allowed disabled:border-hairline-soft aria-invalid:border-error",
        className,
      )}
      {...props}
    />
  );
}

export { Radio };
