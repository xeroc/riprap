import { MechanismCard, SectionBand, TextLink } from "@riprap/ui";

import { Settle } from "../components/Settle";
import { GITHUB_URL } from "./shared";

// §2 — The mechanism, minimal: the lifecycle verbs only. The full design
// (two governed exit doors, three-track stake primitive, swig treasury) lives
// in the repo — linked, not summarized.
const LIFECYCLE = [
  { verb: "found", rest: "(peril, area, window, tiers) → pool" },
  { verb: "join", rest: "(tier) → pool + right to claim" },
  { verb: "claim", rest: "(evidence, fee) → dispute" },
  { verb: "rule", rest: "() → approved: pay up to tier cap" },
  { verb: "crank", rest: "() → refund what's left, pro-rata → dissolved" },
];

export function Mechanism() {
  return (
    <SectionBand id="mechanism" label="how it works" tone="soft">
      <Settle className="flex flex-col gap-(--riprap-space-xl)">
        <h2 className="max-w-2xl tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-lg)]">
          Four verbs. One pool.
        </h2>

        <MechanismCard title="pool lifecycle" className="max-w-2xl">
          <pre className="w-full overflow-x-auto px-1 font-mono text-base leading-loose text-body">
            <code>
              {LIFECYCLE.map((line, i) => (
                <span key={line.verb}>
                  {i > 0 && "\n"}
                  <span className="text-accent">{line.verb}</span>
                  <span>{line.rest}</span>
                </span>
              ))}
            </code>
          </pre>
        </MechanismCard>

        <p className="max-w-2xl leading-relaxed text-body [font:var(--riprap-body-md)]">
          A pool is a program, not a company. It holds USDC behind exactly two governed exit doors —
          spending by adjudication, liquidation at the end — with no discretionary signer. Claims
          are adjudicated by Accord, a sister protocol that is honestly an arbitration oracle:
          jurors drawn at random, commit-reveal votes, appeals that double the jury.
        </p>
        <p className="text-muted-foreground [font:var(--riprap-body-sm)]">
          The full mechanism — pool accounting, the three-track primitive, dissolution — lives in{" "}
          <TextLink href={GITHUB_URL} external>
            the repo
          </TextLink>
          .
        </p>
      </Settle>
    </SectionBand>
  );
}
