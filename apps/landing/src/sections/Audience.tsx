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
            Any group with a risk the fixed-cost sector won't sell — farmers, fishers, crews, clubs,
            a cohort at an event. The terms are written at founding: what's covered, what it pays,
            when it ends. The money stays the group's.
          </p>
          <p className="leading-relaxed text-muted-foreground [font:var(--riprap-body-md)]">
            Behind them: the <span className="text-ink">Sponsor</span> (founds the pool) and the{" "}
            <span className="text-ink">Jurors</span> (staked members who adjudicate and earn by
            being honest).
          </p>
        </div>
      </Settle>
    </SectionBand>
  );
}
