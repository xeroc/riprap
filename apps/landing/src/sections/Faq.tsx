// §5.5 — FAQ: the ten questions a first-time visitor asks, platform register.
// Numberless, instance-free (page laws — tiers, dates, and the peril live on
// instance surfaces; the deep FAQ is meta/marketing/03-website-copy/faq-content.md).
// Native <details> disclosure: keyboard-accessible, no JS, answers in the DOM.
import { SectionBand } from "@riprap/ui";

import { Settle } from "../components/Settle";

// Copy doc §5.5 is the source of truth — rendered verbatim.
const FAQS = [
  {
    q: "Is this insurance?",
    a: "No. A pool is not a policy: no insurer, no underwriting desk, no company that outlives the pool. Members' money goes into a program; approved claims come out of it; the pool never pays more than it holds. If you need regulated insurance — licensed, with a guarantee fund behind it — buy insurance. This is a different thing with a written, narrow shape.",
  },
  {
    q: "Who holds the money, and can the Riprap team move it?",
    a: "A program on Solana holds it, and no, nobody at Riprap can move a pool's funds. Money leaves only through two governed doors: spending, which an approved ruling authorizes, and liquidation, which ends the pool. No admin key over the treasury, no multisig of named people. There is no third path.",
  },
  {
    q: "What's the most I can lose?",
    a: "The money you put in. Every amount is a published term of the pool, visible before you join, and a pool cannot reach into your wallet beyond those terms.",
  },
  {
    q: "What if the pool can't pay every approved claim?",
    a: "Payouts scale down proportionally: every approved claim is paid the same fraction of its approved amount. The pool is the whole balance sheet, so the shortfall is shared by formula, not by triage.",
  },
  {
    q: "What happens to the money if nothing happens?",
    a: "It stays the members'. A pool's lifetime is written at founding: a finite pool settles its claims, returns what remains to the members, and ends; an ongoing pool runs until its members choose to end it. Either way nothing is kept. No retained profit, no surviving treasury, nothing left to capture.",
  },
  {
    q: "Who decides whether a claim is paid?",
    a: "Peers of the same pool — members who opted in as jurors by staking their own money, drawn at random when a claim needs them. Not Riprap, not the sponsor, not a hired judge. The pool itself decides nothing: it files the dispute with Accord, the adjudicator, and enforces whatever ruling comes back.",
  },
  {
    q: "What keeps the jurors honest?",
    a: "Skin in the game and secret votes. Jurors stake to enter the draw; votes are commit-reveal, so nobody can copy a vote mid-round; a juror who rules against the coherent majority loses stake to those who ruled with it, so honesty is the profitable strategy. An appeal redraws a doubled jury, so buying a ruling gets more expensive every round. This is peer adjudication with economic teeth, not a mathematical guarantee of truth: it holds conditional on an honest stake majority.",
  },
  {
    q: "What kinds of risk can a pool cover?",
    a: "Any risk the group agrees to share. The terms are the founder's to write; the protocol imposes no template. What's covered, what it pays, and when it ends are all published before joining opens. Narrow risks work best: a question with evidence and a definable answer is one peers can rule on cleanly, where a vague peril dissolves into argument.",
  },
  {
    q: "What does Riprap charge?",
    a: "Nothing on the first pools. If a pool ever carries a take, that's a published term, visible before anyone joins. If a number isn't published, it isn't charged. The one cost inside a dispute is the juror fee, paid by the member who files.",
  },
  {
    q: "Is this legal?",
    a: "Pool by pool and place by place, before entry opens anywhere. The product is structured as a pool that ends, not as insurance; we won't open a pool in a jurisdiction where that distinction hasn't been reviewed. Until terms are published where you are, treat it as unavailable. This page is not legal advice.",
  },
];

export function Faq() {
  return (
    <SectionBand id="faq" label="questions" tone="soft">
      <Settle className="flex flex-col gap-(--riprap-space-xl)">
        <div className="flex max-w-2xl flex-col gap-4">
          <h2 className="tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-lg)]">
            Fair questions.
          </h2>
          <p className="leading-relaxed text-muted-foreground [font:var(--riprap-body-md)]">
            Answered plainly. Where something is still open, the answer says so.
          </p>
        </div>

        <div className="border-t border-hairline">
          {FAQS.map((f) => (
            <details key={f.q} className="group border-b border-hairline">
              <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
                <h3 className="tracking-tight text-ink [font:var(--riprap-display-sm)]">{f.q}</h3>
                <span aria-hidden className="font-mono text-base text-accent">
                  <span className="group-open:hidden">+</span>
                  <span className="hidden group-open:inline">–</span>
                </span>
              </summary>
              <p className="max-w-2xl pb-6 leading-relaxed text-body [font:var(--riprap-body-md)]">
                {f.a}
              </p>
            </details>
          ))}
        </div>
      </Settle>
    </SectionBand>
  );
}
