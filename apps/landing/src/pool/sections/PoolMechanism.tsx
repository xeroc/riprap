// /2026-breakpoint-blade-pool — "How this pool runs": the platform Mechanism
// pattern instantiated with this pool's actual values (landing-page.md §
// /2026-breakpoint-blade-pool "How this pool runs", 2026-09-27). The tier
// range line is chain-bound (mutual.tiers[0]/[2], policy §5 reference) —
// {{PARAM}} mono placeholders while the chain hasn't answered, never static
// fallbacks. The mono stamps carry policy-doc statics with their §§.
import { LifecycleStrip, SectionBand, usd } from "@riprap/ui";

import { Settle } from "../../components/Settle";
import { poolTiers } from "../mutual";
import { useMutual } from "../useMutual";

// Kit data law: unknown values render as mono {{PARAM}} placeholders.
const PARAM = "{{PARAM}}";

export function PoolMechanism() {
  const mutualQuery = useMutual();
  const tiers = mutualQuery.state === "ready" ? poolTiers(mutualQuery.mutual) : null;
  // policy §5 — the outer bounds of the three on-chain tiers
  const range =
    tiers === null
      ? `${PARAM} to ${PARAM} in · up to ${PARAM} to ${PARAM} out`
      : `${usd(tiers[0].fee)} to ${usd(tiers[2].fee)} in · up to ${usd(tiers[0].cap)} to ${usd(tiers[2].cap)} out`;

  const steps = [
    {
      n: "01",
      h: "You pick a tier.",
      p: "Entry is one payment, made before the conference opens — joining closes the moment coverage begins, so a membership can't be created or reassigned after an incident has occurred. One membership per person; a sponsor can pay, but it's registered in your name.",
      range,
    },
    {
      n: "02",
      h: "The money gathers.",
      p: "Every entry fee lands in one pool — a program on Solana that holds USDC and nothing else.",
      stamp: "ONE POOL · USDC ONLY · NOTHING INVESTED · NO RESERVE · NO PROFIT", // §6
    },
    {
      n: "03",
      h: "The worst case is narrow.",
      p: "Coverage is bodily injury caused by another person intentionally using a knife or bladed instrument against you — including injury sustained while escaping or defending.",
      stamp:
        "15–17 NOVEMBER 2026 · OPENS/CLOSES WITH THE CONFERENCE · OLYMPIA CONVENTION CENTRE + DESIGNATED EVENT AREA, LONDON", // §3, §2
    },
    {
      n: "04",
      h: "Peers rule.",
      p: "A randomly drawn jury of staked members adjudicates on Accord, an arbitration protocol; votes are commit-reveal, incoherent jurors lose stake, an appeal redraws a doubled jury. A request carries five proofs — ticket, ID, police report, medical report, statutory declaration — and pre-pays the juror fee.",
      stamp:
        "JUROR FEE 3 × 50 USDC = 150 USDC · REFUNDED IF APPROVED · KEPT IF DENIED · RETURNED IF ADJUDICATION FAILS", // §7
    },
    {
      n: "05",
      h: "It ends.",
      p: "Payout requests close 10 days after the conference ends; approved requests settle; the entire remaining balance returns to eligible members and the pool dissolves permanently. No third door.",
      stamp:
        "REQUESTS CLOSE 10 DAYS AFTER THE CONFERENCE · REMAINDER RETURNS PRO-RATA · DISSOLVED PERMANENTLY", // §2, §8
    },
  ];

  return (
    <SectionBand id="how-it-works" label="how this pool runs" tone="soft">
      <Settle className="flex flex-col gap-(--riprap-space-xl)">
        <div className="flex max-w-2xl flex-col gap-4">
          <h2 className="tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-lg)]">
            How this pool runs.
          </h2>
          <p className="leading-relaxed text-muted-foreground [font:var(--riprap-body-md)]">
            The same five steps as any Riprap pool — with this pool's actual numbers.
          </p>
        </div>

        <LifecycleStrip />

        <div className="border-t border-hairline">
          {steps.map((s) => (
            <div
              key={s.n}
              data-slot="pool-step"
              className="grid gap-4 border-b border-hairline py-8 sm:grid-cols-[3.5rem_1fr] sm:gap-10"
            >
              <p className="font-mono text-base text-accent">{s.n}</p>
              <div>
                <h3 className="tracking-tight text-ink [font:var(--riprap-display-sm)]">{s.h}</h3>
                <p className="mt-3 max-w-2xl leading-relaxed text-body [font:var(--riprap-body-md)]">
                  {s.p}
                </p>
                {"range" in s && (
                  <p data-num className="mt-3 font-mono text-sm text-ink">
                    {s.range}
                  </p>
                )}
                {"stamp" in s && (
                  <p data-num className="mt-3 font-mono text-xs leading-relaxed text-stone">
                    {s.stamp}
                  </p>
                )}
              </div>
            </div>
          ))}
        </div>
      </Settle>
    </SectionBand>
  );
}
