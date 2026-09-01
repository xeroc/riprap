import { Arrow } from "../atoms/Arrow";
import { Dissolution } from "../atoms/Dissolution";
import { MemberStone } from "../atoms/MemberStone";
import { PoolVessel } from "../atoms/PoolVessel";
import { ProRataRefund } from "../atoms/ProRataRefund";
import { SvgText } from "../atoms/SvgFrame";
import { TreasuryPayout } from "../atoms/TreasuryPayout";
import { usd } from "../lib/poolMath";
import { MonoLine, Panel } from "../scenes/Panel";
import { StoryFrame } from "./StoryFrame";

/**
 * Story 1 — the standard story (data-stories.md).
 *
 * Headline: A member's worst case is $20; the pool's worst case is empty.
 * Source: meta/PROJECT.md worked example (1,000 Standard members):
 * collect $20,000 → absorb 4 claims × $2,000 → return $12,000 ($12 each,
 * the climax number, display size) → dissolve at $0. All frames share the
 * $20,000 money scale.
 */
export interface StandardStoryProps {
  members?: number;
  fee?: number;
  poolBalance?: number;
  claims?: number;
  claimAmount?: number;
  remainder?: number;
  perMember?: number;
}

export function StandardStory({
  members = 1000,
  fee = 20,
  poolBalance = 20000,
  claims = 4,
  claimAmount = 2000,
  remainder = 12000,
  perMember = 12,
}: StandardStoryProps) {
  return (
    <StoryFrame
      headline="A member's worst case is $20; the pool's worst case is empty."
      context="the standard story — collect, absorb, return, dissolve (meta/PROJECT.md worked example)"
      resolution={[
        { text: "the ", mono: false },
        { text: usd(fee), mono: true },
        { text: " fee was a ceiling on loss, not a sunk premium — ", mono: false },
        { text: usd(perMember), mono: true },
        { text: " of it came home. Balance trace: ", mono: false },
        { text: `${usd(poolBalance)} → ${usd(remainder)} → $0`, mono: true },
        { text: ".", mono: false },
      ]}
    >
      {/* frame 1 — collect */}
      <Panel x={40} y={120} width={560} height={260} title="1 — Collect" />
      <MemberStone size="S" seed={21} x={96} y={216} feeTag="$10" />
      <MemberStone size="M" seed={22} x={168} y={204} feeTag="$20" />
      <MemberStone size="L" seed={23} x={264} y={192} feeTag="$40" />
      <Arrow x1={304} y1={228} x2={400} y2={200} color="var(--riprap-funds)" />
      <Arrow x1={196} y1={236} x2={396} y2={216} color="var(--riprap-funds)" />
      <Arrow x1={116} y1={240} x2={396} y2={232} color="var(--riprap-funds)" />
      <PoolVessel
        balance={poolBalance}
        maxBalance={poolBalance}
        x={340}
        y={168}
        interiorWidth={144}
        wallHeight={104}
        surfaceStones={3}
      />
      <MonoLine
        x={56}
        y={360}
        size={13}
        fill="var(--riprap-muted)"
        segments={[
          { text: members.toLocaleString("en-US"), mono: true },
          { text: " members × ", mono: false },
          { text: usd(fee), mono: true },
          { text: " (Standard)", mono: false },
        ]}
      />

      {/* frame 2 — absorb */}
      <Panel x={640} y={120} width={560} height={260} title="2 — Absorb" />
      <polygon points="672,226 686,240 672,254 658,240" fill="var(--riprap-peril)" />
      <SvgText x={672} y={216} size={13} fill="var(--riprap-peril)" anchor="middle">
        incident
      </SvgText>
      <TreasuryPayout
        x={700}
        y={200}
        balance={remainder}
        maxBalance={poolBalance}
        amount={claimAmount}
        interiorWidth={144}
        wallHeight={88}
      />
      <MonoLine
        x={656}
        y={184}
        size={13}
        fill="var(--riprap-muted)"
        segments={[
          { text: String(claims), mono: true },
          { text: " claims · ", mono: false },
          { text: usd(claims * claimAmount), mono: true },
          { text: " out", mono: false },
        ]}
      />

      {/* frame 3 — return (the climax) */}
      <Panel x={40} y={400} width={560} height={260} title="3 — Return" />
      <ProRataRefund
        x={96}
        y={448}
        remainder={remainder}
        maxBalance={poolBalance}
        memberCount={members}
        perMember={perMember}
        interiorWidth={88}
        wallHeight={64}
      />
      <SvgText x={380} y={500} size={44} fill="var(--riprap-funds)" mono anchor="middle">
        {usd(perMember)}
      </SvgText>
      <SvgText x={380} y={532} size={18} fill="var(--riprap-ink)" anchor="middle">
        per member
      </SvgText>
      <SvgText x={380} y={556} size={13} fill="var(--riprap-muted)" anchor="middle">
        the unused fee comes home
      </SvgText>

      {/* frame 4 — dissolve */}
      <Panel x={640} y={400} width={560} height={260} title="4 — Dissolve" />
      <Dissolution x={780} y={460} interiorWidth={160} wallHeight={116} />

      {/* frame-to-frame handoff on the shared scale */}
      <Arrow x1={600} y1={250} x2={640} y2={250} color="var(--riprap-funds)" />
      <Arrow x1={600} y1={530} x2={640} y2={530} color="var(--riprap-deliberation)" dashed />
    </StoryFrame>
  );
}
