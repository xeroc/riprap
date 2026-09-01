import type * as React from "react";

import { cn } from "../../lib/utils";
import { Card } from "../ui/card";

/**
 * `FeatureCard` — 3-up grid cell (DESIGN.md § feature-card) on the shadcn
 * Card shell: card ground, ink text, radius 0, 24px padding, 1px hairline.
 * Title in title-md; body renders as children so copy keeps its
 * landing-page provenance.
 */
export interface FeatureCardProps extends React.ComponentProps<"div"> {
  title: string;
  children?: React.ReactNode;
}

export function FeatureCard({ title, children, className, ...props }: FeatureCardProps) {
  return (
    <Card data-slot="feature-card" className={cn("gap-3 p-6 text-ink", className)} {...props}>
      <h3 className="[font:var(--riprap-title-md)]">{title}</h3>
      <div className="text-body [font:var(--riprap-body-md)]">{children}</div>
    </Card>
  );
}
