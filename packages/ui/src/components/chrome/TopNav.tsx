import { MenuIcon } from "lucide-react";
import type * as React from "react";
import { useState } from "react";

import { cn } from "../../lib/utils";
import { Button } from "../ui/button";
import { Sheet, SheetContent, SheetHeader, SheetTitle, SheetTrigger } from "../ui/sheet";
import { Container } from "./Container";

/**
 * `TopNav` — the top navigation (DESIGN.md § top-nav): ground fill, ink text,
 * 64px height, 1px hairline bottom rule. Mark + wordmark lockup left, mono
 * nav links center-left, Sign In + one primary CTA right. Below 768px the
 * links collapse into a hamburger drawer; the links stay mono.
 */
export interface TopNavLink {
  href: string;
  /** string or node — the X glyph link passes the logo + an sr-only name */
  label: React.ReactNode;
}

export interface TopNavProps extends React.ComponentProps<"header"> {
  links: TopNavLink[];
  /** mark + wordmark lockup slot (the logo SVGs, used as-is) */
  brand?: React.ReactNode;
  /** the brand link href — hash-routed apps pass "#/" (default "/") */
  brandHref?: string;
  signIn?: { href: string; label: string };
  cta?: { href: string; label: string };
  /** account controls slot (wallet button, cluster picker) — rendered before Sign In */
  actions?: React.ReactNode;
}

export function TopNav({
  links,
  brand,
  brandHref,
  signIn,
  cta,
  actions,
  className,
  ...props
}: TopNavProps) {
  const [open, setOpen] = useState(false);

  return (
    <header
      data-slot="top-nav"
      className={cn("border-b border-hairline bg-ground text-ink", className)}
      {...props}
    >
      <Container className={cn("flex h-(--riprap-nav-h) items-center justify-between gap-6")}>
        <div className="flex min-w-0 items-center gap-8">
          {brand && (
            <a href={brandHref ?? "/"} className="flex shrink-0 items-center">
              {brand}
            </a>
          )}
          <nav aria-label="Main" className="hidden md:flex md:items-center md:gap-6">
            {links.map((link) => (
              <a
                key={link.href}
                href={link.href}
                className="relative inline-flex items-center py-4 uppercase tracking-(--riprap-tracking-stamp) text-muted-foreground outline-none transition-colors duration-[160ms] ease-out [font:var(--riprap-mono-label)] before:absolute before:inset-y-0 before:-left-3 before:-right-3 hover:text-ink focus-visible:text-ink focus-visible:ring-3 focus-visible:ring-ring"
              >
                {link.label}
              </a>
            ))}
          </nav>
        </div>

        <div className="flex items-center gap-2">
          {actions && (
            <div data-slot="top-nav-actions" className="flex items-center gap-2">
              {actions}
            </div>
          )}
          {signIn && (
            <Button variant="link" asChild className="hidden md:inline-flex">
              <a href={signIn.href}>{signIn.label}</a>
            </Button>
          )}
          {cta && (
            <Button asChild>
              <a href={cta.href}>{cta.label}</a>
            </Button>
          )}
          <Sheet open={open} onOpenChange={setOpen}>
            <SheetTrigger asChild>
              <Button variant="ghost" size="icon-sm" className="md:hidden" aria-label="Open menu">
                <MenuIcon />
              </Button>
            </SheetTrigger>
            <SheetContent side="right">
              <SheetHeader className="border-b border-hairline">
                <SheetTitle className="sr-only">Menu</SheetTitle>
              </SheetHeader>
              <nav aria-label="Main" className="flex flex-col gap-1">
                {links.map((link) => (
                  <a
                    key={link.href}
                    href={link.href}
                    onClick={() => setOpen(false)}
                    className="px-2 py-4 uppercase tracking-(--riprap-tracking-stamp) text-muted-foreground transition-colors duration-[160ms] ease-out [font:var(--riprap-mono-label)] hover:text-ink"
                  >
                    {link.label}
                  </a>
                ))}
              </nav>
              {signIn && (
                <a
                  href={signIn.href}
                  className="px-2 py-3 text-(--riprap-accent) [font:var(--riprap-body-md)] hover:text-(--riprap-accent-hover)"
                >
                  {signIn.label}
                </a>
              )}
            </SheetContent>
          </Sheet>
        </div>
      </Container>
    </header>
  );
}
