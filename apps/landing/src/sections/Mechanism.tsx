import {
  Claim,
  Filed,
  FlowStep,
  Gather,
  Return,
  Rule,
  SectionBand,
  Sign,
  TextLink,
} from "@riprap/ui";

import { Settle } from "../components/Settle";

// §2 — the mechanism band is the group-pool explainer (copy doc §2 flows,
// 2026-10-20). Two flows — founding and drawing — three numbered steps
// each, glyph-stepped rows under a mono stamp title. Side by side from md
// up; stacked on phones. The 2026-10-11 tabs are retired: the pool steps'
// copy is folded into these descriptions, joining/claiming scenes with it.
const FLOWS = [
  {
    id: "founding",
    title: "Founding the group pool",
    steps: [
      {
        step: "01",
        Glyph: Sign,
        headline: "Approve the purpose",
        text: "Each member signs the pool's purpose with a cryptographic signature. The terms — what's covered, what it pays — are written at founding, before anything happens. Accepting them is the act of joining; a different purpose would be a different pool.",
      },
      {
        step: "02",
        Glyph: Gather,
        headline: "Fund the pool",
        text: "Members pay their share into the pool, on the pool's own terms — one pool, one defined risk. A pool is a program, not a company: it holds USDC and nothing else.",
      },
      {
        step: "03",
        Glyph: Return,
        headline: "Return what's left",
        text: "When the pool closes, unspent funds go back to members pro rata. A pool ends the way its terms say: finite pools settle their claims and dissolve. Money moves only by an adjudicated payout or this wind-down — no admin key, no discretionary signer.",
      },
    ],
  },
  {
    id: "drawing",
    title: "Drawing on group money",
    steps: [
      {
        step: "01",
        Glyph: Filed,
        headline: "File a payout request",
        text: "A member submits a request describing what the money is for. The request carries the evidence the terms demand — an incident covered by the terms, attached and on record.",
      },
      {
        step: "02",
        Glyph: Rule,
        headline: "Check it against the purpose",
        text: (
          <>
            The request is adjudicated against the pool's agreed purpose. Jurors are staked members
            of the same pool, drawn at random when a claim needs them; votes are commit-reveal, and
            an appeal doubles the jury. Adjudication runs on{" "}
            <TextLink href="https://useaccord.xyz" external>
              Accord
            </TextLink>
            , a sister protocol that is honestly an arbitration oracle.
          </>
        ),
      },
      {
        step: "03",
        Glyph: Claim,
        headline: "Get paid",
        text: "Once approved, the payout is released from the pool. An approved claim pays what the terms promise — never more than the pool holds, because there is nothing else to hold.",
      },
    ],
  },
];

export function Mechanism() {
  return (
    <SectionBand id="mechanism" label="how it works" tone="soft">
      <Settle className="flex flex-col gap-(--riprap-space-xl)">
        <h2 className="max-w-2xl tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-lg)]">
          Five steps. One pool.
        </h2>

        <div className="grid gap-(--riprap-space-xl) md:grid-cols-2">
          {FLOWS.map((flow) => (
            <div key={flow.id} className="flex flex-col gap-(--riprap-space-base)">
              <p className="uppercase tracking-(--riprap-tracking-stamp) text-muted [font:var(--riprap-mono-label)]">
                {flow.title}
              </p>
              <div className="border-t border-hairline">
                {flow.steps.map((s) => (
                  <FlowStep key={s.headline} step={s.step} Glyph={s.Glyph} headline={s.headline}>
                    {s.text}
                  </FlowStep>
                ))}
              </div>
            </div>
          ))}
        </div>
      </Settle>
    </SectionBand>
  );
}
