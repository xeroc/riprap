import { ExternalLinkIcon } from "lucide-react";
import type * as React from "react";

import { cn } from "../../lib/utils";

/**
 * `TextLink` — the tertiary CTA (DESIGN.md § Buttons): inline harbor-blue
 * text link. Harbor-blue is an accent: never a fill, never body text.
 * `external` adds the semantic external-link glyph and a safe target.
 */
export interface TextLinkProps extends React.ComponentProps<"a"> {
  external?: boolean;
}

export function TextLink({ className, external, children, ...props }: TextLinkProps) {
  return (
    <a
      data-slot="text-link"
      {...(external ? { target: "_blank", rel: "noopener noreferrer" } : {})}
      className={cn(
        "text-(--riprap-accent) underline-offset-4 transition-colors duration-[160ms] ease-out hover:text-(--riprap-accent-hover) hover:underline focus-visible:ring-3 focus-visible:ring-ring",
        className,
      )}
      {...props}
    >
      {children}
      {external && <ExternalLinkIcon aria-hidden="true" className="ml-1 inline-block size-3.5" />}
    </a>
  );
}
