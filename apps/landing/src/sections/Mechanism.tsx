import {
  ChipIn,
  Claim,
  Filed,
  FlowStep,
  Gather,
  PaysOut,
  Return,
  Rule,
  Seal,
  SectionBand,
  Sign,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextLink,
} from "@riprap/ui";
import { motion, useReducedMotion } from "motion/react";
import { useState } from "react";
import { Settle } from "../components/Settle";

// §2 — the mechanism band is the group-pool explainer (copy doc §2,
// 2026-10-21 founder pass): three lanes — founding, joining, drawing —
// as cards stacked in the left half; hover, focus, or tap a card and its
// three steps settle into the right half (Radix Tabs: the cards are the
// tab list, the pane the tabpanel). Below lg the cards stack with the
// active lane's steps beneath them. The old five-step list, the 2026-10-11
// tabs, and the 2026-10-20 side-by-side flows are folded into these lanes.
const FLOWS = [
  {
    id: "founding",
    Glyph: Seal,
    title: "Founding the pool",
    actor: "the founder",
    steps: [
      {
        step: "01",
        Glyph: Sign,
        headline: "One transaction",
        text: "Anyone founds a pool, no permission to ask. The founder writes the terms — the purpose, the prices, the window, what a payout request must show — in one transaction, not a company formation.",
      },
      {
        step: "02",
        Glyph: Filed,
        headline: "Pin the terms",
        text: "The pool pins the terms at creation, hash and all — written at founding, before anything happens. They can never change afterward. A different purpose would be a different pool.",
      },
      {
        step: "03",
        Glyph: Gather,
        headline: "Open the doors",
        text: "Membership opens on the terms' schedule. The pot waits empty — a pool is a program, not a company: it holds USDC, and only what members put in.",
      },
    ],
  },
  {
    id: "joining",
    Glyph: ChipIn,
    title: "Joining the pool",
    actor: "the member",
    steps: [
      {
        step: "01",
        Glyph: Sign,
        headline: "Accept the terms",
        text: "Anyone joins while membership is open. Each member signs the pool's purpose with a cryptographic signature; accepting the terms is the act of joining, and the terms they accept are the terms that govern.",
      },
      {
        step: "02",
        Glyph: Gather,
        headline: "Pay the entry",
        text: "The published fee lands in the pool, on the pool's own terms — one pool, one defined risk. Paying in buys the same claim right every other member holds: the funders are the pool, and the pool exists for them.",
      },
      {
        step: "03",
        Glyph: Return,
        headline: "Hold your stake",
        text: "A member's money sits in the pot until a ruling or the wind-down moves it — no admin key, no discretionary signer. If nothing is ever claimed, it comes back pro rata.",
      },
    ],
  },
  {
    id: "drawing",
    Glyph: PaysOut,
    title: "Drawing on the pool",
    actor: "the claimant",
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
] as const;

/** The active lane's ruled list — settles in on activation, 40ms stagger
 * per step (DESIGN.md § Motion: settle, not slide); static under
 * reduced motion. */
function LaneSteps({ flow }: { flow: (typeof FLOWS)[number] }) {
  const reduce = useReducedMotion();
  return (
    <div className="border-t border-hairline">
      {flow.steps.map((s, i) =>
        reduce ? (
          <FlowStep key={s.headline} step={s.step} Glyph={s.Glyph} headline={s.headline}>
            {s.text}
          </FlowStep>
        ) : (
          <motion.div
            key={s.headline}
            initial={{ opacity: 0, y: 8 }}
            animate={{ opacity: 1, y: 0 }}
            transition={{ duration: 0.16, ease: "easeOut", delay: 0.04 * i }}
          >
            <FlowStep step={s.step} Glyph={s.Glyph} headline={s.headline}>
              {s.text}
            </FlowStep>
          </motion.div>
        ),
      )}
    </div>
  );
}

export function Mechanism() {
  const [active, setActive] = useState<string>(FLOWS[0].id);
  return (
    <SectionBand id="mechanism" label="how it works" tone="soft">
      <Settle className="flex flex-col gap-(--riprap-space-xl)">
        <h2 className="max-w-2xl tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-lg)]">
          Three acts. One pool.
        </h2>

        <Tabs value={active} onValueChange={setActive} orientation="vertical">
          <div className="grid gap-(--riprap-space-xl) lg:grid-cols-2 lg:items-start">
            {/* the lane cards — the tab list; hover/focus previews, tap selects */}
            <TabsList className="flex-col items-stretch gap-(--riprap-space-base) border-b-0">
              {FLOWS.map((flow) => (
                <TabsTrigger
                  key={flow.id}
                  value={flow.id}
                  onMouseEnter={() => setActive(flow.id)}
                  onFocus={() => setActive(flow.id)}
                  className="flex w-full items-center gap-4 border border-b border-hairline bg-ground px-5 pt-4 pb-4 text-left normal-case transition-colors duration-[160ms] ease-out hover:border-stone focus-visible:ring-3 focus-visible:ring-ring focus-visible:outline-none data-[state=active]:border-stone data-[state=active]:bg-surface-card data-[state=active]:text-ink"
                >
                  {/* the lane glyph — seal / chip-in / pays-out, 44px */}
                  <span className="block w-11 shrink-0">
                    <flow.Glyph />
                  </span>
                  <span className="flex min-w-0 flex-col items-start gap-1">
                    <span className="uppercase tracking-(--riprap-tracking-stamp) [font:var(--riprap-mono-label)]">
                      {flow.title}
                    </span>
                    <span className="text-muted-foreground [font:var(--riprap-body-sm)]">
                      {flow.actor}
                    </span>
                  </span>
                </TabsTrigger>
              ))}
            </TabsList>

            {/* the active lane's steps — the tabpanel */}
            <div>
              {FLOWS.map((flow) => (
                <TabsContent key={flow.id} value={flow.id}>
                  <LaneSteps flow={flow} />
                </TabsContent>
              ))}
            </div>
          </div>
        </Tabs>
      </Settle>
    </SectionBand>
  );
}
