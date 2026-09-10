// /2026-breakpoint-blade-pool — the policy, in full, as the page's fineprint: every
// category of "Micro Mutual — Knife Assault - Policy.md" rendered clearly in
// small type below the offer. Copy is verbatim or lightly compressed from the
// doc; numbers keep their § provenance in comments. The tier table is bound
// to the kit's TIERS (the only allowed prices — repo data law).
import { Card, SectionBand, TIERS, usd } from "@riprap/ui";

import type { ReactNode } from "react";

/** one policy category: § number, title, and its items */
interface PolicySection {
  n: string;
  title: string;
  body: ReactNode;
}

// Sources: meta/Breakpoint/Micro Mutual — Knife Assault - Policy.md §1–§11.
const SECTIONS: PolicySection[] = [
  {
    n: "01",
    title: "Product",
    body: (
      <p>
        Micro Mutual is a one-time mutual insurance pool protecting members against a narrowly
        defined knife assault during a specific conference. Members contribute a fixed entry fee to
        a common pool. A member who experiences a qualifying knife assault during the covered event
        may receive a payout subject to their coverage tier and the remaining funds. After the
        claims period closes, all remaining funds are distributed proportionally among members and
        the mutual is dissolved.
      </p>
    ),
  },
  {
    n: "02",
    title: "Coverage period",
    body: (
      <div className="flex flex-col gap-3">
        <p>
          Coverage begins at the start of the conference and ends at the end of the conference. Only
          incidents during this period and within the covered area qualify.
        </p>
        <p data-num className="font-mono text-xs text-stone">
          BREAKPOINT 2026 · 15-17 NOVEMBER 2026 · OPENS/CLOSES WITH THE CONFERENCE (DAILY HOURS PER
          THE PUBLISHED SCHEDULE) · OLYMPIA CONVENTION CENTRE AND DESIGNATED EVENT AREA, LONDON
        </p>
      </div>
    ),
  },
  {
    n: "03",
    title: "Covered event",
    body: (
      <div className="flex flex-col gap-3">
        <p>
          A knife assault means: a member suffers bodily injury caused by another person
          intentionally using a knife or other sharp-edged or bladed instrument against them.
        </p>
        <p>
          The incident must occur during the coverage period, within the covered geographic area,
          and while the claimant is an active member.
        </p>
      </div>
    ),
  },
  {
    n: "04",
    title: "Exclusions",
    body: (
      <ul className="flex flex-col gap-2">
        {[
          "Injuries caused by the member themselves.",
          "Accidental injuries involving a knife or blade.",
          "Injuries caused by ordinary handling or use of a knife.",
          "Injuries resulting from consensual activities.",
          "Injuries occurring outside the coverage period.",
          "Injuries occurring outside the covered area.",
          "Claims for emotional distress without qualifying bodily injury.",
          "Claims exceeding the member's coverage-tier maximum.",
        ].map((item) => (
          <li key={item} className="flex gap-3">
            <span
              aria-hidden="true"
              className="mt-2 inline-block size-1 shrink-0 bg-hairline-strong"
            />
            {item}
          </li>
        ))}
      </ul>
    ),
  },
  {
    n: "05",
    title: "Coverage tiers",
    body: (
      <div className="flex flex-col gap-3">
        <p>
          Members choose their coverage when joining. The maximum payout is the total amount a
          member can receive for qualifying claims; a member cannot receive more than their tier's
          maximum.
        </p>
        {/* policy §5 — rendered from TIERS, never hardcoded */}
        <table className="w-full border-collapse">
          <thead>
            <tr className="border-b border-hairline text-left">
              <th
                scope="col"
                className="py-2 pr-4 font-normal text-muted-soft [font:var(--riprap-mono-label)]"
              >
                TIER
              </th>
              <th
                scope="col"
                className="py-2 pr-4 font-normal text-muted-soft [font:var(--riprap-mono-label)]"
              >
                ENTRY FEE
              </th>
              <th
                scope="col"
                className="py-2 font-normal text-muted-soft [font:var(--riprap-mono-label)]"
              >
                MAX PAYOUT
              </th>
            </tr>
          </thead>
          <tbody>
            {TIERS.map((t) => (
              <tr key={t.name} className="border-b border-hairline last:border-b-0">
                <td className="py-2 pr-4 [font:var(--riprap-body-sm)]">{t.name}</td>
                <td data-num className="py-2 pr-4 font-mono text-sm text-ink">
                  {usd(t.fee)}
                </td>
                <td data-num className="py-2 font-mono text-sm text-ink">
                  up to {usd(t.cap)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>
      </div>
    ),
  },
  {
    n: "06",
    title: "Pool",
    body: (
      <div className="flex flex-col gap-3">
        <p>
          All member contributions enter a single mutual pool, used exclusively for qualifying claim
          payouts and refunds to members after the claims period. There is no permanent reserve. No
          profit is retained by the mutual.
        </p>
        {/* §6 worked example: 1,000 × $20 = $20,000 */}
        <p data-num className="font-mono text-xs text-stone">
          EXAMPLE: 1,000 MEMBERS × $20 STANDARD = $20,000 TOTAL POOL
        </p>
      </div>
    ),
  },
  {
    n: "07",
    title: "Claims",
    body: (
      <div className="flex flex-col gap-3">
        <p>
          A member may submit a claim for a qualifying knife assault occurring during the coverage
          period. The maximum claim payout is determined by the member's coverage tier. If approved
          claims are less than the pool, the remaining funds are returned to members. If approved
          claims exceed the pool, payouts are reduced proportionally so the mutual never pays more
          than it holds.
        </p>
        {/* §7 example: $20,000 pool, $12,000 claims, $8,000 returned */}
        <p data-num className="font-mono text-xs text-stone">
          EXAMPLE: $20,000 POOL · $12,000 APPROVED CLAIMS · $8,000 RETURNED
        </p>
      </div>
    ),
  },
  {
    n: "08",
    title: "Pool dissolution",
    body: (
      <p>
        The mutual has a finite lifetime. After the conference ends, the claims submission period
        closes, and all approved claims are settled, the remaining balance is distributed to
        eligible members. The mutual is then dissolved permanently — no funds remain.
      </p>
    ),
  },
  {
    n: "09",
    title: "Economic principle",
    body: (
      <p>
        Members pool money to protect one another against a narrowly defined event. If the event
        costs less than expected, members recover the unused money. The entry fee is the member's
        maximum contribution; the coverage tier sets the maximum potential payout.
      </p>
    ),
  },
  {
    n: "10",
    title: "Worked example — Standard tier",
    body: (
      <div className="flex flex-col gap-3">
        <p>
          1,000 members each contribute $20 into a $20,000 pool with a $2,000 maximum individual
          payout. Four qualifying claims are approved at $2,000 each: claims paid $8,000, remaining
          pool $12,000. After the claims period closes, the remaining $12,000 is distributed to
          eligible members and the mutual dissolves — a $20 member receives their share of the
          unused pool back.
        </p>
      </div>
    ),
  },
  {
    n: "11",
    title: "Product promise",
    body: (
      <p>
        Join a temporary community mutual. Pay a fixed amount. Receive defined protection against
        knife assault during the event. If claims don't consume the pool, the remaining money comes
        back to the members. When the event is over, the mutual ends.
      </p>
    ),
  },
];

// The fineprint band: clear items, small type. Two columns on wide screens;
// mono § numbers; hairline card chrome. The policy stays readable in order.
export function PolicyFineprint() {
  return (
    <SectionBand id="policy" label="the policy" tone="soft">
      <div className="flex flex-col gap-(--riprap-space-lg)">
        <h2 className="tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-sm)]">
          The fineprint, in full.
        </h2>
        <p className="text-muted-soft [font:var(--riprap-mono-label)]">
          The comedy stops here. The policy is real.
        </p>
        <div className="grid gap-4 md:grid-cols-2" data-slot="policy-sections">
          {SECTIONS.map((s) => (
            <Card key={s.n} data-slot="policy-section" className="gap-3 p-6">
              <p className="flex items-baseline gap-3 text-muted-soft [font:var(--riprap-mono-label)]">
                <span data-num>§ {s.n}</span>
                <span className="uppercase tracking-(--riprap-tracking-stamp) text-muted-foreground">
                  {s.title}
                </span>
              </p>
              <div className="leading-relaxed text-muted-foreground [font:var(--riprap-body-sm)]">
                {s.body}
              </div>
            </Card>
          ))}
        </div>
      </div>
    </SectionBand>
  );
}
