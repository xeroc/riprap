import type * as React from "react";

import { cn } from "../../lib/utils";

/*
 * Static tone block, no pulse — DESIGN.md motion law bans oscillating loops
 * (settle, not slide; nothing glows or breathes). A skeleton is a lighter tone
 * on the ground, the way a section drawing hatches an unfinished region.
 */
function Skeleton({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div data-slot="skeleton" className={cn("rounded-none bg-strong", className)} {...props} />
  );
}

export { Skeleton };
