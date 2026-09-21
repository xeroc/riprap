// /2026-breakpoint-blade-pool — the policy, in full, as the page's fineprint: every
// category of "Micro Mutual — Knife Assault - Policy.md" rendered clearly in
// small type below the offer. Copy is verbatim or lightly compressed from the
// doc; numbers keep their § provenance in comments. The §5 tier table is bound
// to the on-chain mutual.tiers (landing-page.md § "On-chain states + juror
// modal": {{PARAM}} mono placeholders whenever the chain hasn't answered —
// never static fallback numbers); §6/§7/§10 keep their policy-doc example
// numbers (their source is the policy document, not the chain).
import { Card, SectionBand, shortenAddress, TextLink, usd } from "@riprap/ui";
import type { Address } from "@solana/kit";
import type { ReactNode } from "react";

import { type PoolTier, poolTiers, TIER_NAMES } from "../mutual";
import { useMutual } from "../useMutual";

// Kit data law: unknown values render as mono {{PARAM}} placeholders.
const PARAM = "{{PARAM}}";

/** one policy category: § number, title, and its items */
interface PolicySection {
  n: string;
  title: string;
  body: ReactNode;
}

/** A fineprint table row: name always (copy); prices only once the chain answers. */
type FineTier = { name: string; fee?: number; cap?: number };

function fineRows(tiers: PoolTier[] | null): FineTier[] {
  if (tiers === null) return TIER_NAMES.map((name) => ({ name }));
  return tiers;
}

// Sources: meta/Breakpoint/Micro Mutual — Knife Assault - Policy.md §1–§13.
function buildSections(tiers: PoolTier[] | null, subaccord: Address | null): PolicySection[] {
  return [
    {
      n: "01",
      title: "Product",
      body: (
        <p>
          Micro Mutual is a one-time mutual pool protecting members against a narrowly defined knife
          assault during a specific conference. Members contribute a fixed entry fee to a common
          pool. A member who experiences a qualifying knife assault during the covered event may
          request a discretionary payment, subject to adjudication, their coverage tier, and the
          remaining funds — no member has an enforceable right to a payment. After the payout
          request period closes, all remaining funds are distributed proportionally among members
          and the mutual is dissolved.
        </p>
      ),
    },
    {
      n: "02",
      title: "Coverage period",
      body: (
        <div className="flex flex-col gap-3">
          <p>
            Coverage begins at the start of the conference and ends at the end of the conference.
            Only incidents during this period and within the covered area qualify.
          </p>
          <p data-num className="font-mono text-xs text-stone">
            BREAKPOINT 2026 · 15-17 NOVEMBER 2026 · OPENS/CLOSES WITH THE CONFERENCE (DAILY HOURS
            PER THE PUBLISHED SCHEDULE) · OLYMPIA CONVENTION CENTRE AND DESIGNATED EVENT AREA,
            LONDON
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
            and while the requester is an active member.
          </p>
        </div>
      ),
    },
    {
      n: "04",
      title: "Exclusions",
      body: (
        <ul data-slot="policy-exclusions" className="flex flex-col gap-2">
          {[
            "Injuries caused by the member themselves.",
            "Accidental injuries involving a knife or blade.",
            "Injuries caused by ordinary handling or use of a knife.",
            "Injuries resulting from consensual activities.",
            "Injuries occurring outside the coverage period.",
            "Injuries occurring outside the covered area.",
            "Requests based on emotional distress without qualifying bodily injury.",
            "Requests exceeding the member's coverage-tier maximum.",
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
            member can receive for qualifying payout requests; a member cannot receive more than
            their tier's maximum.
          </p>
          {/* policy §5 — prices from mutual.tiers, {{PARAM}} until the chain answers */}
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
              {fineRows(tiers).map((t) => (
                <tr key={t.name} className="border-b border-hairline last:border-b-0">
                  <td className="py-2 pr-4 [font:var(--riprap-body-sm)]">{t.name}</td>
                  <td data-num className="py-2 pr-4 font-mono text-sm text-ink">
                    {t.fee === undefined ? PARAM : usd(t.fee)}
                  </td>
                  <td data-num className="py-2 font-mono text-sm text-ink">
                    up to {t.cap === undefined ? PARAM : usd(t.cap)}
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
            All member contributions enter a single mutual pool, used exclusively for qualifying
            discretionary payments and refunds to members after the payout request period. There is
            no permanent reserve. No profit is retained by the mutual.
          </p>
          {/* §6 worked example: 1,000 × $20 = $20,000 — policy-doc number, not a chain read */}
          <p data-num className="font-mono text-xs text-stone">
            EXAMPLE: 1,000 MEMBERS × $20 STANDARD = $20,000 TOTAL POOL
          </p>
        </div>
      ),
    },
    {
      n: "07",
      title: "Payout requests",
      body: (
        <div className="flex flex-col gap-3">
          <p>
            A member may submit a payout request for a qualifying knife assault occurring during the
            coverage period. All payments are discretionary: requests are adjudicated by a randomly
            drawn jury of staked members; no member has a contractual or enforceable right to any
            payment; the jury's determination is final. The maximum payment is set by the member's
            coverage tier. If approved requests are less than the pool, the remaining funds are
            returned to members. If approved requests exceed the pool, payments are reduced
            proportionally so the mutual never pays more than it holds.
          </p>
          {/* §7 example: $20,000 pool, $12,000 approved requests, $8,000 returned — policy-doc numbers */}
          <p data-num className="font-mono text-xs text-stone">
            EXAMPLE: $20,000 POOL · $12,000 APPROVED REQUESTS · $8,000 RETURNED
          </p>
          {/* copy doc § on-chain states: {{subaccord}} ← mutual.subaccord, useaccord app link */}
          <p data-num className="font-mono text-xs text-stone">
            ADJUDICATION · SUBACCORD{" "}
            {subaccord === null ? (
              PARAM
            ) : (
              <TextLink
                href={`https://app.useaccord.xyz/#/subaccords/${subaccord}`}
                title={subaccord}
                external
                className="font-mono text-xs"
              >
                {shortenAddress(subaccord)}
              </TextLink>
            )}
          </p>
        </div>
      ),
    },
    {
      n: "08",
      title: "Pool dissolution",
      body: (
        <p>
          The mutual has a finite lifetime. After the conference ends, the payout request period
          closes, and all approved requests are settled, the remaining balance is distributed to
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
            payout. Four qualifying payout requests are approved at $2,000 each: payments $8,000,
            remaining pool $12,000. After the payout request period closes, the remaining $12,000 is
            distributed to eligible members and the mutual dissolves — a $20 member receives their
            share of the unused pool back.
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
          knife assault during the event. If payments don't consume the pool, the remaining money
          comes back to the members. When the event is over, the mutual ends.
        </p>
      ),
    },
    {
      n: "12",
      title: "Legal status",
      body: (
        <div className="flex flex-col gap-3">
          <p>
            The mutual is an unincorporated association under English law — not insurance, and not
            authorised or regulated under the Financial Services and Markets Act. Every payment is
            discretionary, no member has a contractual right to a payout, and the decision-maker's
            determination is final. No profit is earned or distributed, surplus returns to members
            pro-rata, and no risk capital is invested for yield.
          </p>
          <p>
            An unincorporated association has no separate legal personality and no limited
            liability: if the pool is exhausted and a liability arises, the operators may be
            personally exposed. The pool runs on a smart contract on Solana; English law treats
            cryptoassets as personal property, but on-chain association governance is legally
            untested and no UK legislation expressly validates it. The pool is closed, small-value,
            and not operated by way of business; the operators take advice on the money-laundering
            regulations.
          </p>
          {/* policy §12 — authorities as cited in counsel's opinion */}
          <p data-num className="font-mono text-xs text-stone">
            NOT INSURANCE · FSMA 2000 · PERG 6.6.1 · BURRELL [1982] · CCBSA 2014 · MLR 2017
          </p>
        </div>
      ),
    },
    {
      n: "13",
      title: "Counsel's recommendations",
      body: (
        <div className="flex flex-col gap-3">
          {/* policy §13 — each recommendation with the policy's response */}
          <ul data-slot="policy-recommendations" className="flex flex-col gap-2">
            <li>
              1. Reconsider the legal form — a registered society (CCBSA 2014) would provide
              separate legal personality and limited liability, at the cost of annual FCA filings;
              the unincorporated association leaves the operators personally exposed (§12).
            </li>
            <li>2. Document the discretion exhaustively — adopted: §1 and §7.</li>
            <li>
              3. Avoid insurance terminology — adopted throughout: contribution, discretionary
              payment.
            </li>
            <li>
              4. Take specific advice on the smart contract — the interaction between Solana-based
              execution and English association law needs a dedicated opinion.
            </li>
            <li>
              5. Consider FCA pre-application engagement — the Mutual Societies Development Unit can
              confirm whether the model falls within the regulatory perimeter before the structure
              is committed.
            </li>
          </ul>
          <p>
            Counsel's conclusion: the discretionary mutual model is legally viable in principle, but
            the combination of unincorporated status and smart-contract implementation introduces
            material legal uncertainty and personal liability risk. Proceed with caution and
            specific legal advice.
          </p>
        </div>
      ),
    },
  ];
}

// The fineprint band: clear items, small type. Two columns on wide screens;
// mono § numbers; hairline card chrome. The policy stays readable in order.
export function PolicyFineprint() {
  const mutualQuery = useMutual();
  const tiers = mutualQuery.state === "ready" ? poolTiers(mutualQuery.mutual) : null;
  const subaccord = mutualQuery.state === "ready" ? mutualQuery.mutual.subaccord : null;
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
          {buildSections(tiers, subaccord).map((s) => (
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
