import type * as React from "react";

import { cn } from "../../lib/utils";
import { Container } from "./Container";

/**
 * `FooterBand` — the footer (DESIGN.md § footer): 4-column link list, brand
 * slot + tagline, and the closing fact in mono ("dead on schedule" — the
 * DESIGN.md-specified closing line). 64×48px padding, muted text throughout.
 */
export interface FooterLink {
  href: string;
  label: React.ReactNode;
}

export interface FooterColumn {
  heading: string;
  links: FooterLink[];
}

export interface FooterBandProps extends React.ComponentProps<"footer"> {
  columns: FooterColumn[];
  /** mark + wordmark lockup slot */
  brand?: React.ReactNode;
  /** e.g. "Event mutuals on Solana." */
  tagline?: string;
  /** closing mono line — DESIGN.md default: "dead on schedule" */
  closing?: string;
}

export function FooterBand({
  columns,
  brand,
  tagline,
  closing = "dead on schedule",
  className,
  ...props
}: FooterBandProps) {
  return (
    <footer
      data-slot="footer-band"
      className={cn(
        "border-t border-hairline bg-ground pt-16 pb-12 text-muted-foreground",
        className,
      )}
      {...props}
    >
      <Container className="flex flex-col gap-(--riprap-space-xl)">
        <div className="grid gap-10 md:grid-cols-[1fr_repeat(4,minmax(0,1fr))]">
          <div className="flex flex-col gap-3">
            {brand}
            {tagline && (
              <p className="text-muted-foreground [font:var(--riprap-body-sm)]">{tagline}</p>
            )}
          </div>
          {columns.map((column) => (
            <nav key={column.heading} aria-label={column.heading} className="flex flex-col gap-3">
              <h3 className="uppercase tracking-(--riprap-tracking-stamp) text-muted-soft [font:var(--riprap-mono-label)]">
                {column.heading}
              </h3>
              <ul className="flex flex-col gap-2">
                {column.links.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      className="inline-flex items-center py-3 text-muted-foreground outline-none transition-colors duration-[160ms] ease-out hover:text-ink focus-visible:ring-3 focus-visible:ring-ring"
                    >
                      {link.label}
                    </a>
                  </li>
                ))}
              </ul>
            </nav>
          ))}
        </div>
        <div className="border-t border-hairline pt-6">
          <p className="font-mono text-sm text-muted-soft">{closing}</p>
        </div>
      </Container>
    </footer>
  );
}
