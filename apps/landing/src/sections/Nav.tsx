import { TopNav } from "@riprap/ui";

import { Mark } from "../components/Mark";
import { GITHUB_URL, X_URL } from "./shared";

// §0 — Edge-aligned nav (DESIGN.md § top-nav). Mark + wordmark + pre-launch
// status chip left; mono links right. No CTA-right SaaS nav.
export function Nav() {
  return (
    <TopNav
      links={[
        { href: "#mechanism", label: "How it works" },
        { href: X_URL, label: "X" },
        { href: GITHUB_URL, label: "GitHub" },
      ]}
      brand={
        <span className="flex items-center gap-2.5">
          <Mark size={22} />
          <span className="font-mono text-sm font-medium tracking-tight text-ink">riprap</span>
          <span className="ml-1 hidden items-center gap-1.5 font-mono text-xs text-muted-foreground sm:inline-flex">
            <span className="inline-block size-1.5 bg-accent" aria-hidden="true" />
            pre-launch · first pool: Breakpoint 2026
          </span>
        </span>
      }
    />
  );
}
