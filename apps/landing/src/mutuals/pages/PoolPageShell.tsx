// The shared skeleton for a pool's detail page (`#/m/<pubkey-or-slug>`).
// The hero (the offer + the join flow, passed by the page) rides above the
// doc bands: what's covered → not covered → claims → the math → the end →
// the policy, content extracted from the pool's policy/terms markdown. The
// §5 tier table stays under the hero as the doc-priced reference while the
// chain can't answer; every number on it is the doc's, final. The closing
// #policy band is blade-pool parity (2026-10-09): the collapsed disclosure
// every hero's acceptance note links to, carrying the shared raw-terms
// panel — the doc's exact pinned bytes off the evidence server.
import { SectionBand, type WorkedExampleLine, WorkedExampleReceipt } from "@riprap/ui";
import type { Address } from "@solana/kit";
import type { ReactNode } from "react";
import { Settle } from "../../components/Settle";
import { SiteNav } from "../../components/SiteNav";
import { RawPolicyTerms } from "../../pool/sections/RawPolicyTerms";
import { useMutual } from "../../pool/useMutual";
import { Footer } from "../../sections/Footer";
import { poolBySlug } from "../data";
import type { MutualListing, MutualTier, PoolKind } from "../types";
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
  /** the pool's slug in the mutuals directory — resolves the listing (and
   * its pinned pubkey) the #policy band's evidence-server read binds to */
  slug: string;
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

export function PoolPageShell({ config, hero }: { config: PoolPageConfig; hero: ReactNode }) {
  const c = config;
  const bounty = c.kind === "bounty";
  const fees = c.tiers.map((t) => `$${t.fee}`);
  const caps = c.tiers.map((t) => `$${t.cap.toLocaleString("en-US")}`);

  return (
    <>
      <SiteNav />
      <main>
        {hero}

        {/* the §5 tier table — the doc-priced offer reference under the hero */}
        <SectionBand id="tiers" label="the offer" tone="ground">
          <Settle className="flex max-w-md flex-col gap-(--riprap-space-lg)">
            <table className="w-full border-collapse font-mono text-sm">
              <caption className="sr-only">Entry fees and maximum payouts by tier</caption>
              <thead>
                <tr className="border-b border-hairline text-left">
                  <th scope="col" className="pb-2 pr-4 [font:var(--riprap-mono-label)]">
                    tier
                  </th>
                  <th scope="col" className="pb-2 pr-4 text-right [font:var(--riprap-mono-label)]">
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

        {/* the policy — the raw doc, verbatim, off the evidence server */}
        <PoolPolicyTerms listing={poolBySlug(c.slug)} />
      </main>
      <Footer />
    </>
  );
}

/** The closing #policy band — the target every hero's acceptance note
 * ("Chipping in accepts the {pool} policy") reveals: opens the collapsed
 * disclosure and settles the page there (PolicyAcceptNote.revealPolicy).
 * Blade-pool presentation (copy doc § Anchored terms, 2026-09-21), one
 * difference by design: no tabs — the bands above ARE the explained view,
 * the disclosure carries the verbatim doc alone. The mutual read is the
 * listing's pinned pubkey (drafts resolve null → the idle {{PARAM}} state,
 * never a fallback document). */
function PoolPolicyTerms({ listing }: { listing: MutualListing }) {
  const mutualQuery = useMutual((listing.pubkey as Address | undefined) ?? null);
  const mutual = mutualQuery.state === "ready" ? mutualQuery.mutual : null;
  return (
    <SectionBand id="policy" label="the policy" tone="ground">
      <div className="flex flex-col gap-(--riprap-space-lg)">
        <h2 className="tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-sm)]">
          The policy, in full.
        </h2>
        <p data-num className="text-muted-soft [font:var(--riprap-mono-label)]">
          THE POOL IS A JOKE. THE POLICY IS NOT.
        </p>

        {/* collapsed on load — native disclosure */}
        <details data-slot="policy-details" className="group border-y border-hairline">
          <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
            <h3 className="tracking-tight text-ink [font:var(--riprap-display-sm)]">
              Open the policy — verbatim
            </h3>
            <span aria-hidden className="font-mono text-base text-accent">
              <span className="group-open:hidden">+</span>
              <span className="hidden group-open:inline">–</span>
            </span>
          </summary>
          <div className="pb-6">
            <RawPolicyTerms mutual={mutual} />
          </div>
        </details>
      </div>
    </SectionBand>
  );
}
