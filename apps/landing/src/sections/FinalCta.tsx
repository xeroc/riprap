import { SectionBand, TextLink } from "@riprap/ui";

import { Settle } from "../components/Settle";
import { Waitlist } from "../components/Waitlist";
import { X_URL } from "./shared";

// §6 — Final CTA. The member-benefit line as the closing hook.
export function FinalCta() {
  return (
    <SectionBand id="join" tone="soft" className="text-center">
      <Settle className="mx-auto flex max-w-2xl flex-col items-center gap-(--riprap-space-xl)">
        <div className="flex flex-col gap-4">
          <h2 className="tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-xl)]">
            Cap your worst case.
          </h2>
          <p className="text-muted-foreground [font:var(--riprap-body-md)]">
            One email when the first pool opens. That's the whole list.
          </p>
        </div>

        <Waitlist />

        <div className="flex flex-wrap items-center justify-center gap-x-6 gap-y-2 text-sm">
          <TextLink href={X_URL} external>
            @riprapxyz
          </TextLink>
        </div>
      </Settle>
    </SectionBand>
  );
}
