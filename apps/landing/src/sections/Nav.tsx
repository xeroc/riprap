// §0 — nav per DESIGN.md § top-nav (copy doc §0).
import { LogoLockup, TopNav } from "@riprap/ui";

import { X_URL } from "./shared";
export function Nav() {
  return (
    <TopNav
      className="sticky top-0 z-40"
      links={[
        { href: "#mechanism", label: "How it works" },
        { href: X_URL, label: "X" },
      ]}
      brand={
        <span className="flex items-center gap-2.5">
          <LogoLockup size={22} />
          <span className="ml-1 hidden items-center gap-1.5 font-mono text-xs text-muted-foreground sm:inline-flex">
            <span className="inline-block size-1.5 bg-accent mr-1" aria-hidden="true" />
            launch: Breakpoint 2026
          </span>
        </span>
      }
    />
  );
}
