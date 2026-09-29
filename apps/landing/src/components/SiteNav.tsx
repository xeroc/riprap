// The one navbar for every surface (platform, pool, #/app) — copy doc §0 NAV.
// Brand lockup + launch chip, How it works (→ the platform page's mechanism
// section; the router scrolls after the cross-route swap), X with the official
// glyph. Right side on EVERY surface: the cluster select + wallet controls
// (2026-09-29 — copy doc §0); the Open App CTA rides along except inside
// /app, where it's dropped. The wallet hooks ride on the router-level
// provider stack (ADR-0007).
import { LogoLockup, TopNav, XLogo } from "@riprap/ui";
import { AppNavControls } from "../app/controls";
import { X_URL } from "../sections/shared";

export function SiteNav({ inApp = false }: { inApp?: boolean }) {
  return (
    <TopNav
      className="sticky top-0 z-40"
      brandHref="#/"
      links={[
        { href: "#mechanism", label: "How it works" },
        {
          href: X_URL,
          label: (
            <>
              <XLogo className="size-3.5" />
              <span className="sr-only">X</span>
            </>
          ),
        },
      ]}
      brand={
        <span className="flex items-center gap-2.5">
          <LogoLockup size={22} />
          <span className="ml-1 hidden items-center gap-1.5 font-mono text-xs text-muted-foreground sm:inline-flex">
            <span className="mr-1 inline-block size-1.5 bg-accent" aria-hidden="true" />
            launch: Breakpoint 2026
          </span>
        </span>
      }
      actions={<AppNavControls />}
      cta={inApp ? undefined : { href: "#/app", label: "Open App" }}
    />
  );
}
