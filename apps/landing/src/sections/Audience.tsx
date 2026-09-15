import { SectionBand } from "@riprap/ui";

import { Settle } from "../components/Settle";

// §5 — Who it's for. Single-audience focus + honest scope (pre-launch).
export function Audience() {
  return (
    <SectionBand id="audience" label="who it's for" tone="ground">
      <Settle className="flex flex-col gap-(--riprap-space-xl)">
        <h2 className="tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-lg)]">
          The member.
        </h2>

        <div className="flex max-w-2xl flex-col gap-4">
          <p className="leading-relaxed text-body [font:var(--riprap-body-md)]">
            The person going to the event, wallet in pocket. Twenty dollars caps the worst weekend
            at a written peril, a written payout ceiling, and a written end date, and most of it
            comes back when the event is quiet.
          </p>
          <p className="leading-relaxed text-muted-foreground [font:var(--riprap-body-md)]">
            Behind them: the <span className="text-ink">Sponsor</span> (founds a pool at their
            event) and the <span className="text-ink">Jurors</span> (staked members who adjudicate
            and earn by being honest).
          </p>
        </div>
      </Settle>
    </SectionBand>
  );
}
