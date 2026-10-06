import { SectionBand } from "@riprap/ui";

import { Settle } from "../components/Settle";

// §4 — lineage without traction claims. OnRe experiment pass v2 (2026-10-05):
// two dated, sourced rows lead (Lloyd's 1688 origin; mutuals at scale today —
// State Farm, NAMIC majority-share states), the blocker and the two programs
// follow. "Insurer" is off the page (founder call). Provenance in copy doc §4.
const lineage = [
  {
    when: "1688",
    name: "The original form",
    body: "London ship owners pooled their losses in a coffee house — peers carrying peers, no company, no reserves. Lloyd's of London grew out of it.",
  },
  {
    when: "today",
    name: "The structure won",
    body: (
      <>
        The biggest home-and-auto insurance company in America — State Farm — is a mutual, owned by
        the people it covers; in 11 US states, companies organized as mutuals hold the majority of
        the market. The structure works at any scale. It just takes an institution to run one.
      </>
    ),
  },
  {
    when: "the blocker",
    name: "Fixed costs",
    body: (
      <>
        A mutual of strangers needs a treasurer everyone trusts and a court for the subjective
        claims. Off-chain, those two roles mean an institution: the fixed cost a small pooled
        contribution can't carry.
      </>
    ),
  },
  {
    when: "now",
    name: "Two programs",
    body: (
      <>
        Programmatic custody holds the Treasury; peer adjudication rules the claims. The treasurer
        and the court are programs now — the fixed cost that made small cover unsellable is gone.
      </>
    ),
  },
];

export function Heritage() {
  return (
    <SectionBand id="lineage" label="lineage" tone="soft">
      <Settle className="flex flex-col gap-(--riprap-space-xl)">
        <h2 className="max-w-3xl tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-lg)]">
          The mutual is old. The Solana primitive is new.
        </h2>

        <ol className="border-y border-hairline">
          {lineage.map((l) => (
            <li
              key={l.name}
              className="grid gap-2 border-b border-hairline py-6 last:border-b-0 sm:grid-cols-[8rem_1fr] sm:gap-8"
            >
              <div className="flex flex-col gap-1">
                <span className="font-mono text-sm text-accent">{l.when}</span>
                <span className="font-medium text-ink [font:var(--riprap-body-strong)]">
                  {l.name}
                </span>
              </div>
              <p className="max-w-2xl leading-relaxed text-body [font:var(--riprap-body-md)]">
                {l.body}
              </p>
            </li>
          ))}
        </ol>

        <div className="flex flex-col gap-3">
          <p className="max-w-2xl tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-sm)]">
            Protection without a protector.
          </p>
        </div>
      </Settle>
    </SectionBand>
  );
}
