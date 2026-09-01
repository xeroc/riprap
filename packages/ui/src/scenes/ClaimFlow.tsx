import { Arrow } from "../atoms/Arrow";
import { ClaimFiled } from "../atoms/ClaimFiled";
import { CommitRevealVote } from "../atoms/CommitRevealVote";
import { JurorDraw } from "../atoms/JurorDraw";
import { Ruling } from "../atoms/Ruling";
import { SvgFrame, SvgText } from "../atoms/SvgFrame";
import { TreasuryPayout } from "../atoms/TreasuryPayout";
import { usd } from "../lib/poolMath";
import { MonoLine, Panel, SceneTitle } from "./Panel";

/**
 * Scene 2 — claim flow (composition.md § scene templates, 1200×675).
 *
 * Five panels in a Z: claim-filed → juror-draw → commit-reveal-vote →
 * (down) ruling → fork: solid `funds` arrow to payout-through-treasury
 * (`approved`), dashed arrow to the rejected box. The rejected box is drawn
 * EVERY time the claim flow is drawn (ruling atom's do/don't).
 */
export interface ClaimFlowProps {
  /** claimed amount — must read ≤ tierCap (claim-filed law) */
  claimedAmount?: number;
  /** the member's tier max */
  tierCap?: number;
  /** evidence items attached to the claim */
  evidenceCount?: number;
  /** drawn juror count — `{{N_JURORS}}` until a pool fixes it */
  jurorCount?: number;
  /** the ruling that won */
  outcome?: "pay" | "reject";
  /** vote tally [winner, loser] */
  tally?: [number, number];
  /** approved payout printed on the stream */
  payoutAmount?: number;
  /** treasury balance after the payout (vessel fragment fill) */
  balance?: number;
  /** shared money scale */
  maxBalance?: number;
}

export function ClaimFlow({
  claimedAmount = 2000,
  tierCap = 2000,
  evidenceCount = 2,
  jurorCount,
  outcome = "pay",
  tally = [2, 1],
  payoutAmount = 2000,
  balance = 12000,
  maxBalance = 20000,
}: ClaimFlowProps) {
  return (
    <SvgFrame
      width={1200}
      height={675}
      title="Claim flow"
      desc="A claim filed inside the coverage window, a VRF juror draw from the staked pile, commit-reveal voting, a ruling with appeal ladder, payout through the swig treasury policy — and the rejected branch where nothing moves."
    >
      <SceneTitle title="Claim flow" />
      <MonoLine
        x={40}
        y={88}
        size={13}
        fill="var(--riprap-muted)"
        segments={[
          {
            text: "filed → drawn → sealed → revealed → ruled → paid, or closed with nothing moving",
            mono: false,
          },
        ]}
      />

      {/* panel 1 — claim filed */}
      <Panel x={40} y={110} width={344} height={240} title="1 · claim filed" />
      <ClaimFiled
        x={40}
        y={110}
        width={344}
        claimedAmount={claimedAmount}
        tierCap={tierCap}
        evidenceCount={evidenceCount}
      />

      {/* panel 2 — juror draw */}
      <Panel x={428} y={110} width={344} height={240} title="2 · juror draw" />
      <JurorDraw x={428} y={116} jurorCount={jurorCount} />

      {/* panel 3 — commit → reveal */}
      <Panel x={816} y={110} width={344} height={240} title="3 · commit → reveal" />
      <CommitRevealVote x={816} y={116} />

      {/* panel 4 — ruling */}
      <Panel x={816} y={410} width={344} height={220} title="4 · ruling" />
      <Ruling x={828} y={410} outcome={outcome} tally={tally} />

      {/* panel 5 — payout through the treasury (the `pay` branch) */}
      <Panel x={428} y={404} width={344} height={228} title="5 · payout" />
      <TreasuryPayout
        x={452}
        y={452}
        balance={balance}
        maxBalance={maxBalance}
        amount={payoutAmount}
        interiorWidth={108}
        wallHeight={76}
        levelLine={false}
      />

      {/* the rejected box — drawn every time the claim flow is drawn */}
      <Panel x={40} y={410} width={344} height={190} dashed title="rejected" />
      <SvgText x={56} y={470} size={13} fill="var(--riprap-muted)">
        claim closed — nothing moves
      </SvgText>
      <polygon
        points="90,518 102,530 90,542 78,530"
        fill="none"
        stroke="var(--riprap-muted)"
        strokeWidth={3}
      />
      <SvgText x={120} y={535} size={13} fill="var(--riprap-muted)">
        no payout
      </SvgText>
      <SvgText x={56} y={572} size={13} fill="var(--riprap-muted)">
        the pool is unchanged
      </SvgText>

      {/* handoffs: atoms handing off, not shapes floating */}
      <Arrow x1={384} y1={230} x2={424} y2={230} color="var(--riprap-deliberation)" />
      <Arrow x1={772} y1={230} x2={812} y2={230} color="var(--riprap-deliberation)" />
      <Arrow x1={988} y1={350} x2={988} y2={406} color="var(--riprap-deliberation)" />
      <Arrow x1={816} y1={520} x2={776} y2={520} color="var(--riprap-funds)" />
      <SvgText x={796} y={508} size={13} fill="var(--riprap-funds)" anchor="middle">
        approved
      </SvgText>
      <Arrow
        x1={988}
        y1={630}
        x2={212}
        y2={604}
        color="var(--riprap-deliberation)"
        dashed
        via={[
          { x: 988, y: 654 },
          { x: 212, y: 654 },
        ]}
      />
      <SvgText x={600} y={648} size={13} fill="var(--riprap-muted)" anchor="middle">
        rejected
      </SvgText>

      {/* the post-payout balance, on the shared scale */}
      <MonoLine
        x={452}
        y={624}
        size={13}
        fill="var(--riprap-muted)"
        segments={[
          { text: "pool after payout ", mono: false },
          { text: usd(balance), mono: true },
          { text: " on the ", mono: false },
          { text: usd(maxBalance), mono: true },
          { text: " scale", mono: false },
        ]}
      />
    </SvgFrame>
  );
}
