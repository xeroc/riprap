import { SectionBand } from "@riprap/ui";

import { Settle } from "../components/Settle";

// §3 — The structural guarantees + the antagonist. What makes the mutual
// safe is architecture, not promise: two doors, fail-closed math, guaranteed
// death. The thing it replaces is named honestly.
const pillars = [
  {
    n: "01",
    h: "Two doors out.",
    p: "Money leaves a pool only by spending (governed by adjudication) or liquidation (governed by the ownership authority). No third path, no discretionary signer, nobody who can decide.",
  },
  {
    n: "02",
    h: "Fail-closed economics.",
    p: "Payouts are capped twice — by the member's tier and by the pool's balance. If approved claims exceed the pool, payouts scale down proportionally. The mutual can never pay more than it holds, because there is nothing else to hold.",
  },
  {
    n: "03",
    h: "Guaranteed death.",
    p: "When the claims window closes, a permissionless crank returns every unused cent to members, pro-rata, and the pool dissolves permanently. No treasury survives. Nothing to capture.",
  },
];

export function Guarantees() {
  return (
    <SectionBand id="guarantees" label="guarantees" tone="ground">
      <Settle className="flex flex-col gap-(--riprap-space-xl)">
        <h2 className="max-w-3xl tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-lg)]">
          Failure is designed out.
        </h2>

        <div className="border-t border-hairline">
          {pillars.map((p) => (
            <div
              key={p.n}
              className="grid gap-4 border-b border-hairline py-8 sm:grid-cols-[3.5rem_1fr] sm:gap-10"
            >
              <p className="font-mono text-base text-accent">{p.n}</p>
              <div>
                <h3 className="tracking-tight text-ink [font:var(--riprap-display-sm)]">{p.h}</h3>
                <p className="mt-3 max-w-2xl leading-relaxed text-body [font:var(--riprap-body-md)]">
                  {p.p}
                </p>
              </div>
            </div>
          ))}
        </div>

        <div className="flex flex-col gap-6">
          <p className="tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-md)]">
            A mutual, not an institution.
          </p>

          <div className="max-w-3xl border border-hairline bg-card px-6 py-5">
            <p className="uppercase tracking-(--riprap-tracking-stamp) text-muted-foreground [font:var(--riprap-mono-label)]">
              The failure mode, named
            </p>
            <p className="mt-2 leading-relaxed text-body [font:var(--riprap-body-md)]">
              Event "protection" today is a laminated card at a merch table — it says{" "}
              <em>protection</em> and pays{" "}
              <span data-num className="font-mono text-ink">
                $0
              </span>
              . Real insurance can't sell a three-day, one-peril policy: the premium is smaller than
              the insurer's fixed costs. Riprap is the peers pooling it instead.
            </p>
          </div>
        </div>
      </Settle>
    </SectionBand>
  );
}
