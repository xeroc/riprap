import { cva, type VariantProps } from "class-variance-authority";
import { Slot } from "radix-ui";
import type * as React from "react";

import { cn } from "../../lib/utils";

/*
 * DESIGN.md § Buttons — sharp geometry (rounded-none), hairline depth, settle
 * motion. Primary = warm-white block; outline = 1px stone border; link =
 * harbor-blue text (accent only, never a fill). No shadows, no opacity fades:
 * hover swaps tone, press drops 1px.
 */
const buttonVariants = cva(
  "group/button inline-flex shrink-0 items-center justify-center rounded-none border border-transparent bg-clip-padding whitespace-nowrap outline-none select-none [font:var(--riprap-button-type)] transition-[background-color,border-color,color,translate] duration-[160ms] ease-out focus-visible:ring-3 focus-visible:ring-ring aria-invalid:border-error disabled:pointer-events-none [&_svg]:pointer-events-none [&_svg]:shrink-0 [&_svg:not([class*='size-'])]:size-4",
  {
    variants: {
      variant: {
        primary:
          "h-10 bg-primary px-5 text-on-primary hover:bg-primary-active active:translate-y-px disabled:bg-strong disabled:text-muted-soft",
        outline:
          "h-10 border-hairline-strong px-5 text-ink hover:border-stone disabled:border-hairline-soft disabled:text-muted-soft",
        ghost: "h-10 px-3 text-body hover:bg-strong hover:text-ink disabled:text-muted-soft",
        link: "h-10 px-0 text-(--riprap-accent) underline-offset-4 hover:text-(--riprap-accent-hover) hover:underline disabled:text-muted-soft",
      },
      size: {
        default: "",
        sm: "h-9",
        lg: "h-11",
        icon: "size-10 px-0",
        "icon-sm": "size-8 px-0",
        "icon-lg": "size-11 px-0",
      },
    },
    defaultVariants: {
      variant: "primary",
      size: "default",
    },
  },
);

function Button({
  className,
  variant = "primary",
  size = "default",
  asChild = false,
  ...props
}: React.ComponentProps<"button"> &
  VariantProps<typeof buttonVariants> & {
    asChild?: boolean;
  }) {
  const Comp = asChild ? Slot.Root : "button";

  return (
    <Comp
      data-slot="button"
      data-variant={variant}
      data-size={size}
      className={cn(buttonVariants({ variant, size, className }))}
      {...props}
    />
  );
}

export { Button, buttonVariants };
