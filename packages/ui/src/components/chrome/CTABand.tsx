import type * as React from "react";

import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Container } from "./Container";

/**
 * `CTABand` — the pre-footer close (DESIGN.md § cta-band): ground-soft band
 * with hairline rules above and below, one centered display headline, a
 * single warm-white CTA. The warm-white block is spent once per page.
 */
export interface CTABandProps extends React.ComponentProps<"section"> {
  headline: string;
  cta: { href: string; label: string };
  /** optional deadpan footnote under the CTA */
  footnote?: string;
}

export function CTABand({ headline, cta, footnote, className, ...props }: CTABandProps) {
  return (
    <section
      data-slot="cta-band"
      className={cn(
        "border-y border-hairline bg-ground-soft py-(--riprap-space-section)",
        className,
      )}
      {...props}
    >
      <Container className="flex flex-col items-center gap-(--riprap-space-xl) text-center">
        <h2 className="tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-lg)]">
          {headline}
        </h2>
        <Button asChild>
          <a href={cta.href}>{cta.label}</a>
        </Button>
        {footnote && (
          <p className="text-muted-foreground [font:var(--riprap-body-sm)]">{footnote}</p>
        )}
      </Container>
    </section>
  );
}
