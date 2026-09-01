import type * as React from "react";

import { cn } from "../../lib/utils";
import { Container } from "./Container";

/**
 * `SectionBand` — the section-drawing grid primitive (DESIGN.md § Layout):
 * 80px vertical rhythm, 1px hairline rule between bands, alternating ground
 * tones. Every page band is a SectionBand; content sits in the 1200px column.
 */
export interface SectionBandProps extends React.ComponentProps<"section"> {
  /** mono section label, e.g. "how it works" */
  label?: string;
  /** ground tone — alternate between bands */
  tone?: "ground" | "soft";
  /** draw the 1px closing rule (default true) */
  rule?: boolean;
  /** strip the 80px vertical padding (edge-to-edge diagrams) */
  flush?: boolean;
}

export function SectionBand({
  label,
  tone = "ground",
  rule = true,
  flush = false,
  className,
  children,
  ...props
}: SectionBandProps) {
  return (
    <section
      data-slot="section-band"
      data-tone={tone}
      className={cn(
        "border-hairline",
        tone === "soft" ? "bg-ground-soft" : "bg-ground",
        rule && "border-b",
        !flush && "py-(--riprap-space-section)",
        className,
      )}
      {...props}
    >
      <Container className="flex flex-col gap-(--riprap-space-xl)">
        {label && (
          <h2 className="uppercase tracking-(--riprap-tracking-stamp) text-muted-foreground [font:var(--riprap-mono-label)]">
            {label}
          </h2>
        )}
        {children}
      </Container>
    </section>
  );
}
