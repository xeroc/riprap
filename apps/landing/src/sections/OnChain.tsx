// §1.5 — the why-on-chain band (OnRe experiment v2, 2026-10-05, copy doc
// §1.5). Founder call: the v1 "guarantees" band (two doors / fail-closed /
// dissolves) read as slop and overclaimed dissolution. v2 sells the three
// things that are genuinely better with mutuals on-chain — transparency,
// cost, composability — sourced from meta/marketing/07-brand-assets/
// why-on-chain.md (A1/A2, B2, D2). No stacking/nesting/reinsurance claims.
// Provisional copy, NOT FOR DEPLOY without a second founder pass.
import { SectionBand } from "@riprap/ui";

import { Settle } from "../components/Settle";

const BENEFITS = [
  {
    stamp: "Transparent",
    h: "Every number is public.",
    p: "The pool's balance, every payment in, every claim, every ruling: public on-chain, readable by anyone, live. Solvency is a number you can check whenever you want.",
  },
  {
    stamp: "Cost",
    h: "The back office is transaction fees.",
    p: "Custody is a program, claims are settled by drawn peers, payouts are a permissionless transaction. The machinery that makes small cover unsellable — branches, claims departments, sales commissions — doesn't exist here.",
  },
  {
    stamp: "Composable",
    h: "Plugs into all of Solana.",
    p: "A pool is a public program on the same rails as the rest of Solana. It holds USDC and pays any wallet, and every other program on-chain can read it, price it, or build on it — the pool is a part of DeFi, not a website.",
  },
];

export function OnChain() {
  return (
    <SectionBand id="why-on-chain" label="why on-chain" tone="soft">
      <Settle className="flex flex-col gap-(--riprap-space-xl)">
        <div className="flex max-w-2xl flex-col gap-4">
          <h2 className="tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-lg)]">
            Better on-chain.
          </h2>
          <p className="leading-relaxed text-muted-foreground [font:var(--riprap-body-md)]">
            Three things change when a pool is a program instead of a company.
          </p>
        </div>

        <div className="grid gap-(--riprap-space-lg) sm:grid-cols-3 sm:gap-(--riprap-space-xl)">
          {BENEFITS.map((b) => (
            <div
              key={b.stamp}
              className="flex flex-col gap-3 border-t border-hairline pt-(--riprap-space-md)"
            >
              <p className="uppercase tracking-(--riprap-tracking-stamp) text-accent [font:var(--riprap-mono-label)]">
                {b.stamp}
              </p>
              <h3 className="tracking-tight text-ink [font:var(--riprap-display-sm)]">{b.h}</h3>
              <p className="leading-relaxed text-body [font:var(--riprap-body-sm)]">{b.p}</p>
            </div>
          ))}
        </div>
      </Settle>
    </SectionBand>
  );
}
