import { SectionBand } from "@riprap/ui";

import { Settle } from "../components/Settle";

// §4 — lineage without traction claims.

const lineage = [
  {
    when: "oldest",
    name: "Mutual aid",
    body: "Peers pool money, qualifying losses get paid, whatever is left returns. The oldest fix there is.",
  },
  {
    when: "the blocker",
    name: "Fixed costs",
    body: (
      <>
        A mutual of strangers needs a treasurer everyone trusts and a judge for the subjective
        claims. Off-chain, those two roles mean an institution: the fixed cost a{" "}
        <span data-num className="font-mono text-ink">
          $20
        </span>{" "}
        entry fee can't carry.
      </>
    ),
  },
  {
    when: "now",
    name: "Two programs",
    body: "Programmatic custody holds the pool behind two governed exit doors. Accord's arbitration oracle adjudicates. Treasurer and judge, both programs.",
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
          <p className="text-muted-foreground [font:var(--riprap-mono-label)]">
            We claim the mechanism. We don't claim traction. The first pool is the build target.
          </p>
        </div>
      </Settle>
    </SectionBand>
  );
}
