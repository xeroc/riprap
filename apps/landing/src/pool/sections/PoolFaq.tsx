// /2026-breakpoint-blade-pool — the FAQ at instance register (landing-page.md
// § /2026-breakpoint-blade-pool "FAQ", 2026-09-27): the platform §5.5 pattern
// (native <details> disclosure, hairline rows, mono +/– marker, no JS) with
// this pool's actual numbers — every one from the policy (§§ cited per item)
// or, for tier prices/caps, bound to mutual.tiers ({{PARAM}} mono while the
// chain hasn't answered, never static fallbacks).
import { SectionBand, usd } from "@riprap/ui";
import type { ReactNode } from "react";

import { Prose } from "../../components/Prose";
import { Settle } from "../../components/Settle";
import { type PoolTier, poolTiers } from "../mutual";
import { useMutual } from "../useMutual";

// Kit data law: unknown values render as mono {{PARAM}} placeholders.
const PARAM = "{{PARAM}}";

function capsLine(tiers: PoolTier[] | null): string {
  return tiers === null
    ? `BASIC UP TO ${PARAM} · STANDARD UP TO ${PARAM} · PREMIUM UP TO ${PARAM}`
    : `BASIC UP TO ${usd(tiers[0].cap)} · STANDARD UP TO ${usd(tiers[1].cap)} · PREMIUM UP TO ${usd(tiers[2].cap)}`;
}

function feesLine(tiers: PoolTier[] | null): string {
  return tiers === null
    ? `${PARAM} · ${PARAM} · ${PARAM} BY TIER`
    : `${usd(tiers[0].fee)} · ${usd(tiers[1].fee)} · ${usd(tiers[2].fee)} BY TIER`;
}

function buildFaqs(tiers: PoolTier[] | null): { q: string; a: ReactNode }[] {
  return [
    {
      // policy §3, §2
      q: "What exactly is covered?",
      a: (
        <Prose text="Bodily injury caused by another person intentionally using a knife or other bladed instrument against you — including injury sustained while escaping or defending. It must happen during the conference (15–17 November 2026, daily hours per the published schedule), inside the Olympia Convention Centre and the designated event area, while you're an active member." />
      ),
    },
    {
      // policy §4
      q: "What's not covered?",
      a: (
        <Prose text="Self-inflicted injuries. Accidents involving a blade, and ordinary knife handling. Consensual activities. Staged or collusive assaults. Injuries from a fight you started or willingly joined, or suffered while committing a criminal offence. Anything outside the coverage window or the covered area. Distress without qualifying bodily injury." />
      ),
    },
    {
      // policy §5 (caps ← mutual.tiers), §7
      q: "How much can I get?",
      a: (
        <div className="flex flex-col gap-3">
          <p>Up to your tier's maximum:</p>
          <p data-num className="font-mono text-sm text-ink">
            {capsLine(tiers)}
          </p>
          <Prose text="The jury can approve less, never more. If approved requests exceed the pool, every payment scales down proportionally — the pool never pays more than it holds." />
        </div>
      ),
    },
    {
      // policy §7
      q: "What do I have to show?",
      a: (
        <Prose text="Five documents, all required: your event ticket in your own name, government photo ID, the police report, the treating practitioner's medical report, and a statutory declaration made before a solicitor or commissioner for oaths. An incomplete set is not adjudicated. Filing pre-pays the juror fee — 3 jurors at 50 USDC each, 150 USDC in total — refunded with an approved payment, kept on a denial, returned if adjudication fails." />
      ),
    },
    {
      // policy §7
      q: "Who decides?",
      a: (
        <Prose text="A jury of staked members of this pool, drawn at random when a request is filed. Votes stay sealed until the round closes; a juror who rules against the coherent majority loses stake to those who ruled with it; an appeal redraws a doubled jury. Adjudication runs on Accord, an arbitration protocol, and the ruling is final once its appeal procedure is exhausted. Nobody at Riprap decides anything." />
      ),
    },
    {
      // policy §2, §8, §10
      q: "What if nobody gets stabbed?",
      a: (
        <Prose text="Then the pool did its job cheaply. Payout requests close 10 days after the conference ends; once approved requests are settled, the entire remaining balance is returned to eligible members and the pool dissolves permanently. On the policy's worked example, $12,000 of a $20,000 pool goes back to members." />
      ),
    },
    {
      // policy §5
      q: "Can I join at the door?",
      a: (
        <Prose text="No. Joining closes when coverage begins, so a membership can't be created or reassigned after an incident has occurred. One membership per person. An employer or a friend can pay the entry fee, but the membership must be registered in your name before joining closes — payouts and refunds go to you, not the sponsor." />
      ),
    },
    {
      // policy §12
      q: "Is this insurance?",
      a: (
        <Prose text="No. The pool is an unincorporated association under English law, not authorised or regulated under the Financial Services and Markets Act 2000. Every payment is discretionary; no member has a contractual right to one. If you need regulated insurance — licensed, with a guarantee fund behind it — buy insurance." />
      ),
    },
    {
      // policy §9 (fees ← mutual.tiers, §5)
      q: "What's the most I can lose?",
      a: (
        <p>
          Your entry fee —{" "}
          <span data-num className="font-mono">
            {feesLine(tiers)}
          </span>{" "}
          — paid once. That's the whole exposure: the pool can't reach into your wallet, and there
          is nothing else to pay.
        </p>
      ),
    },
  ];
}

export function PoolFaq() {
  const mutualQuery = useMutual();
  const tiers = mutualQuery.state === "ready" ? poolTiers(mutualQuery.mutual) : null;
  return (
    <SectionBand id="faq" label="questions" tone="soft">
      <Settle className="flex flex-col gap-(--riprap-space-xl)">
        <div className="flex max-w-2xl flex-col gap-4">
          <h2 className="tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-lg)]">
            Questions, with the numbers.
          </h2>
          <p className="leading-relaxed text-muted-foreground [font:var(--riprap-body-md)]">
            The ones a Breakpoint attendee asks.
          </p>
        </div>

        <div className="border-t border-hairline" data-slot="pool-faqs">
          {buildFaqs(tiers).map((f) => (
            <details key={f.q} className="group border-b border-hairline">
              <summary className="flex cursor-pointer list-none items-baseline justify-between gap-6 py-6 [&::-webkit-details-marker]:hidden">
                <h3 className="tracking-tight text-ink [font:var(--riprap-display-sm)]">{f.q}</h3>
                <span aria-hidden className="font-mono text-base text-accent">
                  <span className="group-open:hidden">+</span>
                  <span className="hidden group-open:inline">–</span>
                </span>
              </summary>
              <div className="max-w-2xl pb-6 leading-relaxed text-body [font:var(--riprap-body-md)]">
                {f.a}
              </div>
            </details>
          ))}
        </div>
      </Settle>
    </SectionBand>
  );
}
