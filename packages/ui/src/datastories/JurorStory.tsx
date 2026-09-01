import { CommitRevealVote } from "../atoms/CommitRevealVote";
import { JurorDraw } from "../atoms/JurorDraw";
import { JurorStone } from "../atoms/JurorStone";
import { Ruling } from "../atoms/Ruling";
import { Panel } from "../scenes/Panel";
import { StoryFrame } from "./StoryFrame";

/**
 * Story 5 — the juror's side of the table (data-stories.md).
 *
 * Headline: Members judge members — a $10 stake buys juror duty, fees, and
 * slash exposure. Sources: meta/Pool Program.md (opt-in at deposit, $10
 * stake, unstake anytime, claimant pre-pays round-1 fees) + Accord core
 * mechanism (fees to coherent jurors, slash a fraction, appeals double the
 * jury). Never captioned "trustless".
 */
export interface JurorStoryProps {
  /** juror stake — $10 confirmed */
  stake?: string;
  jurorCount?: number;
}

export function JurorStory({ stake = "$10", jurorCount = 3 }: JurorStoryProps) {
  return (
    <StoryFrame
      headline={`Members judge members — a ${stake} stake buys juror duty, fees, and slash exposure.`}
      context="the juror's side of the table — opt-in, drawn, paid or slashed (meta/Pool Program.md + Accord core mechanism)"
      resolution={[
        {
          text: "adjudication is peers with skin in the game, not a hired judge — an arbitration oracle, never captioned ",
          mono: false,
        },
        { text: "“trustless”", mono: false },
        { text: ".", mono: false },
      ]}
    >
      {/* frame 1 — opt in: one stone, the deliberation ring, the stake */}
      <Panel x={40} y={120} width={344} height={440} title="1 — Opt in" />
      <JurorStone x={208} y={300} size="M" seed={5} feeTag="$20" stake={stake} />

      {/* frame 2 — drawn: VRF, weighted by stake, from this mutual only */}
      <Panel x={428} y={120} width={344} height={440} title="2 — Drawn" />
      <JurorDraw x={428} y={140} jurorCount={jurorCount} />

      {/* frame 3 — paid or slashed: sealed votes converge; fees and slashes settle */}
      <Panel x={816} y={120} width={344} height={440} title="3 — Paid or slashed" />
      <CommitRevealVote x={824} y={132} />
      <Ruling x={828} y={352} outcome="pay" tally={[2, 1]} />
    </StoryFrame>
  );
}
