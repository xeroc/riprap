// Copy: meta/marketing/03-website-copy/landing-page.md § HOW IT WORKS (verbatim).
import { LifecycleOverview } from "@riprap/ui";
import { Viz } from "./shared";

const STEPS = [
  {
    title: "1. Join a pool",
    body: "Pick your tier and pay the entry fee from your wallet. $10 caps your payout at $1,000; $20 at $2,000; $40 at $4,000. The pool covers exactly one peril, in one defined area, for the event's coverage window — so you know what's covered before you pay, not after.",
  },
  {
    title: "2. Hope you never need it",
    body: "If a qualifying incident happens during the window and inside the covered area, you file a claim with evidence and pre-pay the first round of juror fees. Jurors — staked peers, drawn at random, weighted by stake — review the evidence and vote in commit-reveal so nobody can copy an answer. Approved claims are paid from the pool, up to your tier cap.",
  },
  {
    title: "3. Get most of it back",
    body: "When the claims window closes, a permissionless crank returns every unused cent to members, pro-rata. In the worked example, each of 1,000 Standard members gets $12 of their $20 back. Then the pool dissolves permanently. No treasury survives. Nothing is retained.",
  },
] as const;

export function HowItWorks() {
  return (
    <section id="how-it-works" className="wrap" aria-labelledby="how-it-works-heading">
      <h2 id="how-it-works-heading">Collect. Adjudicate. Dissolve.</h2>
      <div className="steps">
        {STEPS.map((step) => (
          <article key={step.title} className="step">
            <h3>{step.title}</h3>
            <p>{step.body}</p>
          </article>
        ))}
      </div>
      <Viz caption="The 8-step lifecycle on the worked example's money scale: $20,000 recruited, $12,000 after four approved claims, $0 at dissolution. Step 3 (juror opt-in) is optional.">
        <LifecycleOverview />
      </Viz>
    </section>
  );
}
