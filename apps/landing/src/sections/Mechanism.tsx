// §2 — the lifecycle in five plates; the full design lives in the repo (copy doc §2).
import { LifecycleStrip, SectionBand } from "@riprap/ui";

import { Settle } from "../components/Settle";

// Steps mirror LifecycleStrip's order (join → gather → rule → claim →
// liquidate). §3's guarantees folded in: two doors → liquidate,
// fail-closed caps → a claim is paid.
const STEPS = [
  {
    n: "01",
    h: "One more member.",
    p: "Anyone joins while membership is open — the ring keeps an empty slot. The pool's terms — what's covered, what it pays — are written at founding, before anything happens.",
  },
  {
    n: "02",
    h: "Money gathers.",
    p: "Members pay in on the pool's own terms — one pool, one defined risk. A pool is a program, not a company — it holds USDC and nothing else.",
  },
  {
    n: "03",
    h: "Peers decide.",
    p: "Jurors are staked members of the same pool, drawn at random when a claim needs them. Votes are commit-reveal; an appeal doubles the jury. Adjudication is run by Accord, a sister protocol that is honestly an arbitration oracle.",
  },
  {
    n: "04",
    h: "A claim is paid.",
    p: "An incident covered by the terms, evidence attached, the jury rules. An approved claim pays what the terms promise — never more than the pool holds, because there is nothing else to hold.",
  },
  {
    n: "05",
    h: "Liquidate.",
    p: "Money leaves a pool only by spending (governed by adjudication) or liquidation. No third path, no discretionary signer, nobody who can decide.",
  },
];

export function Mechanism() {
  return (
    <SectionBand id="mechanism" label="how it works" tone="soft">
      <Settle className="flex flex-col gap-(--riprap-space-xl)">
        <h2 className="max-w-2xl tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-lg)]">
          Five steps. One pool.
        </h2>

        <LifecycleStrip />

        <div className="border-t border-hairline">
          {STEPS.map((s) => (
            <div
              key={s.n}
              className="grid gap-4 border-b border-hairline py-8 sm:grid-cols-[3.5rem_1fr] sm:gap-10"
            >
              <p className="font-mono text-base text-accent">{s.n}</p>
              <div>
                <h3 className="tracking-tight text-ink [font:var(--riprap-display-sm)]">{s.h}</h3>
                <p className="mt-3 max-w-2xl leading-relaxed text-body [font:var(--riprap-body-md)]">
                  {s.p}
                </p>
              </div>
            </div>
          ))}
        </div>
      </Settle>
    </SectionBand>
  );
}
