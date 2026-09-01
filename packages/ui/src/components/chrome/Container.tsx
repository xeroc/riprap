import type * as React from "react";

import { cn } from "../../lib/utils";

/** The section-drawing content column: capped at 1200px, guttered. */
export function Container({ className, ...props }: React.ComponentProps<"div">) {
  return (
    <div
      data-slot="container"
      className={cn("mx-auto w-full max-w-(--riprap-content-max) px-4 md:px-6", className)}
      {...props}
    />
  );
}
