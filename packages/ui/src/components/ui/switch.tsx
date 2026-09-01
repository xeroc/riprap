import { Switch as SwitchPrimitive } from "radix-ui";
import type * as React from "react";

import { cn } from "../../lib/utils";

/*
 * A switch is chrome, not a disc: rectangular track, square thumb, hairline
 * edge (DESIGN.md — the avatar is the only circle). Checked = the warm-white
 * primary block; the thumb settles across, nothing bounces.
 */
function Switch({
  className,
  size = "default",
  ...props
}: React.ComponentProps<typeof SwitchPrimitive.Root> & {
  size?: "sm" | "default";
}) {
  return (
    <SwitchPrimitive.Root
      data-slot="switch"
      data-size={size}
      className={cn(
        "peer group/switch relative inline-flex shrink-0 items-center rounded-none border border-hairline-strong bg-strong transition-[background-color,border-color] duration-[160ms] ease-out outline-none focus-visible:ring-3 focus-visible:ring-ring aria-invalid:border-error data-checked:border-primary data-checked:bg-primary data-disabled:cursor-not-allowed data-disabled:border-hairline-soft data-[size=default]:h-5 data-[size=default]:w-9 data-[size=sm]:h-4 data-[size=sm]:w-7",
        className,
      )}
      {...props}
    >
      <SwitchPrimitive.Thumb
        data-slot="switch-thumb"
        className="pointer-events-none block rounded-none bg-stone transition-[background-color,translate] duration-[160ms] ease-out group-data-[size=default]/switch:size-3.5 group-data-[size=default]/switch:translate-x-[3px] group-data-[size=default]/switch:data-checked:translate-x-[18px] group-data-[size=sm]/switch:size-3 group-data-[size=sm]/switch:translate-x-[3px] group-data-[size=sm]/switch:data-checked:translate-x-[13px] group-data-[size=default]/switch:data-checked:bg-on-primary group-data-[size=sm]/switch:data-checked:bg-on-primary"
      />
    </SwitchPrimitive.Root>
  );
}

export { Switch };
