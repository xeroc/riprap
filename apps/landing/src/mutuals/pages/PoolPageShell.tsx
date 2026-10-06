// The shared skeleton for a pool's detail page (`#/m/<pubkey-or-slug>`).
// Placeholder depth by founder call (2026-10-05): the bands mirror the Blade
// Pool page's rhythm (offer hero → what's covered → not covered → claims →
// math → the end) but the content is static, extracted from the pool's
// policy/terms markdown — no chain reads, no join flow. When a pool goes
// live, its page grows the on-chain binding the Blade Pool page has.
import { SectionBand, StampBadge, type WorkedExampleLine, WorkedExampleReceipt } from "@riprap/ui";
import { Settle } from "../../components/Settle";
import { SiteNav } from "../../components/SiteNav";
import { Footer } from "../../sections/Footer";
import { MUTUAL_EVENT } from "../data";
import type { MutualTier, PoolKind } from "../types";

export interface PoolPageConfig {
  name: string;
  /** the StampBadge event tag, e.g. "Breakpoint" */
  event: string;
  kind: PoolKind;
  /** hero subhead — the offer, deadpan (§1/§11) */
  tagline: string;
  /** §11 product promise, line per line */
  promise: string[];
  tiers: MutualTier[];
  /** §5 severity grades — the grade → payment schedule, for graded pools */
  grades?: { grade: string; label: string; finding: string; pays: string }[];
  /** §3 definition, verbatim quote */
  definition: string;
  /** §3 definitions/grades/conditions, line per line */
  definitionNotes: string[];
  /** §4 exclusions, the characterful lines, compressed */
  exclusions: string[];
  /** §7 required proof, short labels, in order */
  proof: string[];
  /** the §7 adjudication-fee note (final per the docs) */
  feeNote: string;
  /** §10 worked example — receipt lines + closing figure + the honest note */
  example: { lines: WorkedExampleLine[]; total: WorkedExampleLine; note: string };
  /** §8 winding-up, compressed */
  endNote: string;
  /** overrides the end-note's default caveat (pool-specific TODO state) */
  caveat?: string;
}

export function PoolPageShell({ config }: { config: PoolPageConfig }) {
  const c = config;
  const bounty = c.kind === "bounty";
  const fees = c.tiers.map((t) => `$${t.fee}`);
  const caps = c.tiers.map((t) => `$${t.cap.toLocaleString("en-US")}`);

  return (
    <>
      <SiteNav />
      <main>
        {/* the offer — stamp, name, one-liner, tier table, window */}
        <SectionBand id="top" tone="ground">
          <Settle className="flex flex-col gap-(--riprap-space-lg)">
            <div className="flex flex-wrap items-center gap-3">
              <StampBadge pool={c.name} event={c.event} />
              <p className="text-muted-soft [font:var(--riprap-mono-label)]">
                {MUTUAL_EVENT.venue} · {MUTUAL_EVENT.window}
              </p>
            </div>
            <h1 className="max-w-3xl tracking-(--riprap-tracking-mega) text-ink [font:var(--riprap-display-md)] sm:[font:var(--riprap-display-xl)]">
              {c.name}.
            </h1>
            <p className="max-w-[36rem] leading-relaxed text-body [font:var(--riprap-body-md)]">
              {c.tagline}
            </p>
            <div className="max-w-md">
              <table className="w-full border-collapse font-mono text-sm">
                <caption className="sr-only">Entry fees and maximum payouts by tier</caption>
                <thead>
                  <tr className="border-b border-hairline text-left">
                    <th scope="col" className="pb-2 pr-4 [font:var(--riprap-mono-label)]">
                      tier
                    </th>
                    <th
                      scope="col"
                      className="pb-2 pr-4 text-right [font:var(--riprap-mono-label)]"
                    >
                      entry
                    </th>
                    <th
                      scope="col"
                      className="pb-2 text-right uppercase tracking-(--riprap-tracking-stamp) [font:var(--riprap-mono-label)]"
                    >
                      {bounty ? "bounty" : "max payout"}
                    </th>
                  </tr>
                </thead>
                <tbody>
                  {c.tiers.map((t, i) => (
                    <tr key={t.name} className="border-b border-hairline last:border-b-0">
                      <th scope="row" className="py-2 pr-4 text-left font-normal text-body">
                        {t.name}
                      </th>
                      <td data-num className="py-2 pr-4 text-right text-ink">
                        {fees[i]}
                      </td>
                      <td data-num className="py-2 text-right text-ink">
                        {caps[i]}
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </Settle>
        </SectionBand>

        {/* what's covered / what pays — §3 verbatim + the definitions */}
        <SectionBand id="covered" label={bounty ? "what pays" : "what's covered"} tone="soft">
          <Settle className="flex flex-col gap-(--riprap-space-xl)">
            <h2 className="tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-lg)]">
              {bounty ? "What pays." : "What's covered."}
            </h2>
            <blockquote className="max-w-3xl border-l-2 border-accent pl-(--riprap-space-md) leading-relaxed text-body [font:var(--riprap-body-md)]">
              {c.definition}
            </blockquote>
            {c.grades ? (
              <div className="max-w-3xl">
                <table className="w-full border-collapse font-mono text-sm">
                  <caption className="sr-only">Severity grades and payments</caption>
                  <thead>
                    <tr className="border-b border-hairline text-left">
                      <th
                        scope="col"
                        className="pb-2 pr-4 whitespace-nowrap [font:var(--riprap-mono-label)]"
                      >
                        grade
                      </th>
                      <th scope="col" className="pb-2 pr-4 [font:var(--riprap-mono-label)]">
                        the jury sees
                      </th>
                      <th
                        scope="col"
                        className="pb-2 text-right uppercase tracking-(--riprap-tracking-stamp) [font:var(--riprap-mono-label)]"
                      >
                        pays
                      </th>
                    </tr>
                  </thead>
                  <tbody>
                    {c.grades.map((g) => (
                      <tr key={g.grade} className="border-b border-hairline last:border-b-0">
                        <th
                          scope="row"
                          className="py-3 pr-4 text-left align-top font-normal whitespace-nowrap text-ink"
                        >
                          <span data-num>{g.grade}</span> · {g.label}
                        </th>
                        <td className="py-3 pr-4 align-top leading-relaxed text-body [font:var(--riprap-body-sm)]">
                          {g.finding}
                        </td>
                        <td
                          data-num
                          className="py-3 text-right align-top whitespace-nowrap text-ink"
                        >
                          {g.pays}
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            ) : null}
            <ul className="flex max-w-3xl flex-col gap-3">
              {c.definitionNotes.map((note) => (
                <li
                  key={note}
                  className="border-t border-hairline pt-3 leading-relaxed text-body [font:var(--riprap-body-sm)]"
                >
                  {note}
                </li>
              ))}
            </ul>
          </Settle>
        </SectionBand>

        {/* not covered — §4, the characterful lines */}
        <SectionBand
          id="exclusions"
          label={bounty ? "doesn't qualify" : "not covered"}
          tone="ground"
        >
          <Settle className="flex flex-col gap-(--riprap-space-xl)">
            <h2 className="tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-lg)]">
              {bounty ? "Doesn't qualify." : "Not covered."}
            </h2>
            <ul className="flex max-w-3xl flex-col">
              {c.exclusions.map((line) => (
                <li
                  key={line}
                  className="border-t border-hairline py-3 leading-relaxed text-body last:border-b last:border-hairline [font:var(--riprap-body-sm)]"
                >
                  {line}
                </li>
              ))}
            </ul>
          </Settle>
        </SectionBand>

        {/* claims — §7 proof list, fee, jury */}
        <SectionBand id="claims" label="claims" tone="soft">
          <Settle className="flex flex-col gap-(--riprap-space-xl)">
            <h2 className="tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-lg)]">
              A claim carries its proof.
            </h2>
            <ol className="flex max-w-3xl flex-col">
              {c.proof.map((item, i) => (
                <li
                  key={item}
                  className="flex gap-4 border-t border-hairline py-3 leading-relaxed text-body last:border-b last:border-hairline [font:var(--riprap-body-sm)]"
                >
                  <span data-num className="font-mono text-sm text-accent">
                    {String(i + 1).padStart(2, "0")}
                  </span>
                  {item}
                </li>
              ))}
            </ol>
            <p className="max-w-3xl leading-relaxed text-muted-foreground [font:var(--riprap-body-sm)]">
              {c.feeNote} Claims are adjudicated by a randomly drawn jury of staked members
              (Accord); all payments are discretionary — no member has an enforceable right to one.
              If approved claims exceed the pot, payments scale down proportionally; it never pays
              more than it holds.
            </p>
          </Settle>
        </SectionBand>

        {/* the math — §10 as a receipt */}
        <SectionBand id="math" label="the math" tone="ground">
          <Settle className="flex flex-col gap-(--riprap-space-xl)">
            <h2 className="tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-lg)]">
              The math, on the doc's example.
            </h2>
            <div className="max-w-md">
              <WorkedExampleReceipt
                label="worked example"
                lines={c.example.lines}
                total={c.example.total}
              />
            </div>
            <p className="max-w-3xl leading-relaxed text-muted-foreground [font:var(--riprap-body-sm)]">
              {c.example.note}
            </p>
          </Settle>
        </SectionBand>

        {/* the end — §8/§9 + the draft caveat */}
        <SectionBand id="end" label="the end" tone="soft">
          <Settle className="flex flex-col gap-(--riprap-space-xl)">
            <h2 className="tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-lg)]">
              It ends.
            </h2>
            <div className="flex max-w-3xl flex-col gap-4">
              {c.promise.map((line) => (
                <p
                  key={line}
                  className="leading-relaxed text-body [font:var(--riprap-body-md)] first:text-ink first:tracking-(--riprap-tracking-display) first:[font:var(--riprap-display-sm)]"
                >
                  {line}
                </p>
              ))}
              <p className="leading-relaxed text-muted-foreground [font:var(--riprap-body-sm)]">
                {c.endNote}{" "}
                {c.caveat ??
                  "Prices follow the doc's tier table — final in the docs; nothing on this page is live until the pool is on-chain."}
              </p>
            </div>
          </Settle>
        </SectionBand>
      </main>
      <Footer />
    </>
  );
}
