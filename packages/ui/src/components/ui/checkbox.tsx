import type * as React from "react";

import { cn } from "../../lib/utils";

/*
 * DESIGN.md § forms — a native checkbox, restyled: hairline box on card
 * ground, radius 2px, stone fill + warm-white check when checked, settle
 * color change only (no scale/bounce). Native input (keyboard + form
 * semantics for free); the check is an inline SVG in currentColor so no
 * color literal escapes tokens.css.
 */
function Checkbox({ className, ...props }: React.ComponentProps<"input">) {
  return (
    <span data-slot="checkbox" className="relative inline-flex size-[18px] shrink-0">
      <input
        type="checkbox"
        data-slot="checkbox-input"
        className={cn(
          "peer appearance-none checked:border-stone checked:bg-stone checked:hover:border-stone cursor-pointer rounded-input border border-hairline-strong bg-card transition-colors duration-[160ms] ease-out focus-visible:-outline-offset-2 focus-visible:outline-2 focus-visible:outline-stone disabled:cursor-not-allowed disabled:border-hairline-soft aria-invalid:border-error",
          className,
        )}
        {...props}
      />
      <svg
        aria-hidden="true"
        viewBox="0 0 12 12"
        className="pointer-events-none absolute inset-0 m-auto hidden size-3 text-card peer-checked:block"
      >
        <path
          d="M2 6.5 4.8 9 10 3"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="square"
        />
      </svg>
    </span>
  );
}

export { Checkbox };
