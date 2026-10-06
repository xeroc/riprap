// §1.7 — the comparison band (OnRe experiment v2, 2026-10-05, copy doc
// §1.7). Founder-requested table: the three ways a group can carry a risk.
// The Riprap column is the hero of the band: accent-tinted background, an
// accent frame, a cascade settle on first scroll arrival (cells settle
// top-to-bottom, 40ms stagger — DESIGN.md motion law), and a tint that
// deepens on row hover. No footnote (founder call). No "insurer" anywhere.
// Provisional copy, NOT FOR DEPLOY without a second founder pass.

import { SectionBand } from "@riprap/ui";
import { useInView, useReducedMotion } from "motion/react";
import { type CSSProperties, useRef } from "react";
import { Settle } from "../components/Settle";

/** Row label, then the three columns: Riprap pool / insurance policy / nothing. */
const ROWS: [label: string, pool: string, policy: string, nothing: string][] = [
  [
    "What you put in",
    "one entry fee, published before you join",
    "premiums, priced by the company",
    "the full loss, when it lands",
  ],
  [
    "Who holds the money",
    "a program on Solana — the group's own pool",
    "the company's balance sheet",
    "you, alone",
  ],
  [
    "Who decides a claim",
    "jurors drawn from the pool's own members",
    "a claims desk at the company",
    "a court, if you sue",
  ],
  [
    "Your worst case",
    "the entry fee",
    "the deductible, the exclusions, the fine print",
    "everything",
  ],
  ["If nobody claims", "the money stays the group's", "the company keeps it", "you were lucky"],
  [
    "Small or narrow risks",
    "the whole point — the terms are the founder's to write",
    "rarely sold — the premium is smaller than the paperwork",
    "always available, at full price",
  ],
  ["How it ends", "when the group decides — or never", "when you stop paying", "it doesn't"],
];

export function Compare() {
  const tableRef = useRef<HTMLTableElement>(null);
  const arrived = useInView(tableRef, { once: true, amount: 0.3 });
  const reduce = useReducedMotion();
  // reduced motion: the column renders in its settled state, tint and frame only
  const settled = arrived || (reduce ?? false);

  return (
    <SectionBand id="compare" label="the alternative" tone="ground">
      <Settle className="flex flex-col gap-(--riprap-space-xl)">
        <div className="flex max-w-2xl flex-col gap-4">
          <h2 className="tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-lg)]">
            Mutual, insurance, or nothing.
          </h2>
          <p className="leading-relaxed text-muted-foreground [font:var(--riprap-body-md)]">
            The three ways a group can carry a risk it can't avoid. The first batch runs the first
            column.
          </p>
        </div>

        <div className="overflow-x-auto">
          <table
            ref={tableRef}
            data-slot="compare"
            className="w-full min-w-[44rem] border-collapse"
          >
            <caption className="sr-only">
              A Riprap pool compared with an insurance policy and with no cover.
            </caption>
            <thead>
              <tr className="border-b border-hairline text-left">
                <th scope="col" className="pr-6 pb-3 [font:var(--riprap-mono-label)]" />
                <th scope="col" className="p-0">
                  <span
                    data-arrived={settled}
                    style={{ "--col-delay": "0ms" } as CSSProperties}
                    className="flex h-full items-center border-x border-t-2 border-accent bg-(--riprap-accent)/10 px-4 py-2 uppercase tracking-(--riprap-tracking-stamp) text-accent transition-[opacity,translate] duration-(--riprap-settle) ease-out data-[arrived=false]:-translate-y-1 data-[arrived=false]:opacity-0 [font:var(--riprap-mono-label)] motion-reduce:transition-none motion-reduce:data-[arrived=false]:translate-y-0 motion-reduce:data-[arrived=false]:opacity-100"
                  >
                    A Riprap pool
                  </span>
                </th>
                <th
                  scope="col"
                  className="pl-6 pr-4 pb-3 text-left uppercase tracking-(--riprap-tracking-stamp) text-muted-soft [font:var(--riprap-mono-label)]"
                >
                  An insurance policy
                </th>
                <th
                  scope="col"
                  className="pb-3 uppercase tracking-(--riprap-tracking-stamp) text-muted-soft [font:var(--riprap-mono-label)]"
                >
                  Nothing
                </th>
              </tr>
            </thead>
            <tbody>
              {ROWS.map(([label, pool, policy, nothing], i) => (
                <tr key={label} className="group border-b border-hairline last:border-b-0">
                  <th
                    scope="row"
                    className="py-4 pr-6 text-left align-top font-normal whitespace-nowrap text-muted-foreground [font:var(--riprap-body-sm)]"
                  >
                    {label}
                  </th>
                  <td
                    className={`p-0 align-top border-x border-accent bg-(--riprap-accent)/10 transition-colors duration-(--riprap-settle) group-hover:bg-(--riprap-accent)/20 ${
                      i === ROWS.length - 1 ? "border-b-2" : ""
                    }`}
                  >
                    <span
                      data-arrived={settled}
                      style={{ "--col-delay": `${(i + 1) * 40}ms` } as CSSProperties}
                      className="block px-4 py-4 font-medium text-ink transition-[opacity,translate] duration-(--riprap-settle) ease-out delay-(--col-delay) data-[arrived=false]:-translate-y-1 data-[arrived=false]:opacity-0 [font:var(--riprap-body-sm)] motion-reduce:transition-none motion-reduce:data-[arrived=false]:translate-y-0 motion-reduce:data-[arrived=false]:opacity-100"
                    >
                      {pool}
                    </span>
                  </td>
                  <td className="py-4 pl-6 pr-4 align-top text-muted-foreground [font:var(--riprap-body-sm)]">
                    {policy}
                  </td>
                  <td className="py-4 align-top text-muted-foreground [font:var(--riprap-body-sm)]">
                    {nothing}
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </Settle>
    </SectionBand>
  );
}
