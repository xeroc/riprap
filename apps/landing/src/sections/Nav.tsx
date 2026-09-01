// §0 — nav per DESIGN.md § top-nav (copy doc §0).
import { LogoLockup, TopNav } from "@riprap/ui";

import { GITHUB_URL, X_URL } from "./shared";
export function Nav() {
  return (
    <TopNav
      className="sticky top-0 z-40"
      links={[
        { href: "#mechanism", label: "How it works" },
        { href: X_URL, label: "X" },
        { href: GITHUB_URL, label: "GitHub" },
      ]}
      brand={
        <span className="flex items-center gap-2.5">
          <LogoLockup size={22} />
          <span className="ml-1 hidden items-center gap-1.5 font-mono text-xs text-muted-foreground sm:inline-flex">
            <span className="inline-block size-1.5 bg-accent" aria-hidden="true" />
            pre-launch · first pool: Breakpoint 2026
          </span>
        </span>
      }
    />
  );
}
