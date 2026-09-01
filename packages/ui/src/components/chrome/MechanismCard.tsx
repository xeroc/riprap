import type * as React from "react";

import { cn } from "../../lib/utils";
import { Card } from "../ui/card";
import { PlateTicks } from "./PlateTicks";

/**
 * `MechanismCard` — the diagram plate (DESIGN.md § mechanism-card): a shadcn
 * Card carrying one drawing, registered at the corners by plate ticks —
 * the section-drawing finish that marks "this is a drawing, not chrome".
 * The diagram is a child slot; draw it with the kit's illustrations.
 */
export interface MechanismCardProps extends React.ComponentProps<"figure"> {
  /** plate label, e.g. "pool lifecycle" — mono uppercase */
  title: string;
  /** the diagram — a glyph or SVG from the kit's illustrations */
  children?: React.ReactNode;
}

export function MechanismCard({ title, children, className, ...props }: MechanismCardProps) {
  return (
    <figure
      data-slot="mechanism-card"
      className={cn("relative m-0 flex flex-col", className)}
      {...props}
    >
      <PlateTicks />
      <Card className="flex-1 gap-0 py-0">
        <figcaption className="border-b border-hairline px-4 py-3 uppercase tracking-(--riprap-tracking-stamp) text-muted-foreground [font:var(--riprap-mono-label)]">
          {title}
        </figcaption>
        <div className="flex flex-1 items-center justify-center p-6">{children}</div>
      </Card>
    </figure>
  );
}
