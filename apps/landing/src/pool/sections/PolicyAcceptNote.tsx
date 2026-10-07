// PolicyAcceptNote — the acceptance fineprint under the chip-in CTA (copy doc
// § /2026-breakpoint-blade-pool "acceptance note", 2026-09-29): joining binds
// the member to this pool's policy, so the line rides under every joinable
// CTA — `Connect a wallet to chip in` and `Chip in {{fee}}` — and never once
// covered or entry-closed, when there is nothing left to accept. The wallet
// signature is the assent; the line's job is conspicuousness, one sentence
// from the button.
import { TextLink } from "@riprap/ui";
import type { MouseEvent } from "react";

/** Same-route jump to the policy band: a bare `#policy` href would leave the
 * pool route (the hash router routes on the whole hash), so open the collapsed
 * disclosure and settle the page there instead of navigating. */
function revealPolicy(event: MouseEvent<HTMLAnchorElement>) {
  event.preventDefault();
  const band = document.getElementById("policy");
  band?.querySelector("details")?.setAttribute("open", "");
  band?.scrollIntoView?.();
}

export function PolicyAcceptNote({ poolName, href }: { poolName: string; href: string }) {
  return (
    <p className="text-muted-foreground [font:var(--riprap-body-sm)]" data-slot="policy-accept">
      Chipping in accepts{" "}
      <TextLink href={href} onClick={revealPolicy}>
        the {poolName} policy
      </TextLink>
      .
    </p>
  );
}
