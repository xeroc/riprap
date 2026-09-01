import type * as React from "react";

import { cn } from "../../lib/utils";

/**
 * `FeatureCard` — 3-up grid cell (DESIGN.md § feature-card): card ground,
 * ink text, radius 0, 24px padding, 1px hairline border. Title in title-md;
 * body renders as children so copy keeps its landing-page provenance.
 */
export interface FeatureCardProps extends React.ComponentProps<"div"> {
  title: string;
  children?: React.ReactNode;
}

export function FeatureCard({ title, children, className, ...props }: FeatureCardProps) {
  return (
    <div
      data-slot="feature-card"
      className={cn(
        "flex flex-col gap-3 rounded-none border border-hairline bg-card p-6 text-ink",
        className,
      )}
      {...props}
    >
      <h3 className="[font:var(--riprap-title-md)]">{title}</h3>
      <div className="text-body [font:var(--riprap-body-md)]">{children}</div>
    </div>
  );
}
