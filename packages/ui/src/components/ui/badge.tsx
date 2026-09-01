import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "../../lib/utils";

/*
 * DESIGN.md § badge-stamp — stamps, never pills. Transparent ground, stone
 * text, 1px hairline border, radius 0. Uppercase belongs to mono only.
 */
const badgeVariants = cva(
  "group/badge inline-flex h-fit w-fit shrink-0 items-center justify-center gap-1 rounded-none border px-2.5 py-1 uppercase tracking-(--riprap-tracking-stamp) whitespace-nowrap [font:var(--riprap-mono-label)] transition-[background-color,border-color,color] duration-[160ms] ease-out focus-visible:ring-3 focus-visible:ring-ring has-data-[icon=inline-end]:pr-1.5 has-data-[icon=inline-start]:pl-1.5 aria-invalid:border-error [&>svg]:pointer-events-none [&>svg]:size-3!",
  {
    variants: {
      variant: {
        default: "border-hairline bg-transparent text-stone",
        strong: "border-hairline-strong bg-transparent text-ink",
        accent:
          "border-hairline-strong bg-transparent text-(--riprap-accent) hover:text-(--riprap-accent-hover)",
        success: "border-success/60 bg-transparent text-success",
        destructive: "border-error/60 bg-transparent text-error",
      },
    },
    defaultVariants: {
      variant: "default",
    },
  },
);

function Badge({
  className,
  variant = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"span"> & VariantProps<typeof badgeVariants> & { asChild?: boolean }) {
  const Comp = asChild ? Slot.Root : "span";

  return (
    <Comp
      data-slot="badge"
      data-variant={variant}
      className={cn(badgeVariants({ variant }), className)}
      {...props}
    />
  );
}

export { Badge, badgeVariants };
