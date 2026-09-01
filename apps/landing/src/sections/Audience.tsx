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
            at a written peril, a written payout ceiling, and a written end date — and most of it
            comes back when the event is quiet.
          </p>
          <p className="leading-relaxed text-muted-foreground [font:var(--riprap-body-md)]">
            Behind them: the <span className="text-ink">Sponsor</span> (founds a pool at their
            event) and the <span className="text-ink">Juror</span> (a staked member who adjudicates
            and earns by being honest).
          </p>
        </div>

        <div className="max-w-2xl border border-hairline bg-card px-6 py-5">
          <p className="uppercase tracking-(--riprap-tracking-stamp) text-muted-foreground [font:var(--riprap-mono-label)]">
            Honest scope
          </p>
          <p className="mt-2 leading-relaxed text-body [font:var(--riprap-body-md)]">
            Riprap is pre-launch. No pool has run, no members exist, no payouts to show. The first
            pool — Blade Pool @ Breakpoint{" "}
            <span data-num className="font-mono text-ink">
              2026
            </span>{" "}
            — is the worked example, not a track record. No traction numbers, because there is no
            traction. Read the policy. Follow the build.
          </p>
        </div>
      </Settle>
    </SectionBand>
  );
}
