import {
  ClaimApproval,
  FundingPool,
  LifecycleStrip,
  SectionBand,
  Tabs,
  TabsContent,
  TabsList,
  TabsTrigger,
  TextLink,
} from "@riprap/ui";

import { Settle } from "../components/Settle";

// §2 — the lifecycle in five plates; the full design lives in the repo (copy doc §2).
// 2026-10-11: the band runs as three tabs (copy doc §2 tabs) — the pool story
// unchanged on the first tab; joining and claiming pair their explanation with
// the kit's loop scenes.

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
    p: "A pool ends the way its terms say: finite pools settle their claims and dissolve; ongoing pools run until the members end them. Money moves only by an adjudicated payout or the pool's wind-down — no admin key, no discretionary signer.",
  },
];

export function Mechanism() {
  return (
    <SectionBand id="mechanism" label="how it works" tone="soft">
      <Settle className="flex flex-col gap-(--riprap-space-xl)">
        <h2 className="max-w-2xl tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-lg)]">
          Five steps. One pool.
        </h2>

        <Tabs defaultValue="pool">
          <TabsList>
            <TabsTrigger value="pool">The pool</TabsTrigger>
            <TabsTrigger value="joining">Joining</TabsTrigger>
            <TabsTrigger value="claiming">Claiming</TabsTrigger>
          </TabsList>

          {/* the pool — the lifecycle story, unchanged (copy doc §2) */}
          <TabsContent value="pool" className="flex flex-col gap-(--riprap-space-xl)">
            <LifecycleStrip />

            <div className="border-t border-hairline">
              {STEPS.map((s) => (
                <div
                  key={s.n}
                  className="grid gap-4 border-b border-hairline py-8 sm:grid-cols-[3.5rem_1fr] sm:gap-10"
                >
                  <p className="font-mono text-base text-accent">{s.n}</p>
                  <div>
                    <h3 className="tracking-tight text-ink [font:var(--riprap-display-sm)]">
                      {s.h}
                    </h3>
                    <p className="mt-3 max-w-2xl leading-relaxed text-body [font:var(--riprap-body-md)]">
                      {s.p}
                    </p>
                  </div>
                </div>
              ))}
            </div>
          </TabsContent>

          {/* joining — copy doc §2 tabs: one act, sign + pay (copy doc §2 tabs) */}
          <TabsContent value="joining" className="flex flex-col gap-(--riprap-space-lg)">
            <p className="max-w-2xl leading-relaxed text-body [font:var(--riprap-body-md)]">
              Each pool comes with its own rules, a policy, or terms of service. On joining the
              pool, a user accepts the immutable terms and the fee lands in the pool.
            </p>
            <div className="flex py-(--riprap-space-sm)">
              <div className="w-full max-w-2xl">
                <FundingPool />
              </div>
            </div>
          </TabsContent>

          {/* claiming — copy doc §2 tabs: payout requests and the process */}
          <TabsContent value="claiming" className="flex flex-col gap-(--riprap-space-lg)">
            <p className="max-w-2xl leading-relaxed text-body [font:var(--riprap-body-md)]">
              A payout request carries the evidence the terms demand. A jury of staked members rules
              against the original purpose. An approved claim pays from the pool, never more than it
              holds. Adjudication runs on{" "}
              <TextLink href="https://useaccord.xyz" external>
                Accord
              </TextLink>
              , an open arbitration protocol — its ruling is what moves the money.
            </p>
            <div className="flex py-(--riprap-space-sm)">
              <div className="w-full max-w-2xl">
                <ClaimApproval />
              </div>
            </div>
          </TabsContent>
        </Tabs>
      </Settle>
    </SectionBand>
  );
}
