import type * as React from "react";

import { cn } from "../../lib/utils";

/**
 * `MechanismCard` — the wireframe diagram card (DESIGN.md § mechanism-card):
 * flat, drawn, not decorated. Card ground, 1px hairline, radius 0. The
 * diagram itself is a child slot — draw it with the primitives kit
 * (atoms/scenes per meta/primitives), never with gradient or glow chrome.
 */
export interface MechanismCardProps extends React.ComponentProps<"figure"> {
  /** mechanism label, e.g. "two doors" — mono uppercase */
  title: string;
  /** the diagram — an SVG from the primitives kit */
  children?: React.ReactNode;
}

export function MechanismCard({ title, children, className, ...props }: MechanismCardProps) {
  return (
    <figure
      data-slot="mechanism-card"
      className={cn("flex flex-col rounded-none border border-hairline bg-card", className)}
      {...props}
    >
      <figcaption className="border-b border-hairline px-4 py-3 uppercase tracking-(--riprap-tracking-stamp) text-muted-foreground [font:var(--riprap-mono-label)]">
        {title}
      </figcaption>
      <div className="flex flex-1 items-center justify-center p-6">{children}</div>
    </figure>
  );
}
