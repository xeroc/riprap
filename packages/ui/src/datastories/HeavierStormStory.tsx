import { Arrow } from "../atoms/Arrow";
import { Dissolution } from "../atoms/Dissolution";
import { PoolVessel } from "../atoms/PoolVessel";
import { ProRataRefund } from "../atoms/ProRataRefund";
import { SvgText } from "../atoms/SvgFrame";
import { TreasuryPayout } from "../atoms/TreasuryPayout";
import { usd } from "../lib/poolMath";
import { MonoLine, numeralSegments, Panel } from "../scenes/Panel";
import { StoryFrame } from "./StoryFrame";

/**
 * Story 2 — the heavier-storm variant (data-stories.md).
 *
 * Headline: Same $20,000 pool, a heavier storm — $12,000 paid out, $8,000
 * comes home. Source: policy doc §7 example. Frame 1 is IDENTICAL to Story
 * 1's frame 1 (same scale, so the later drop reads louder) — the refund is
 * whatever the storm leaves. $8 per member is derived ($8,000 ÷ 1,000).
 */
export interface HeavierStormStoryProps {
  members?: number;
  poolBalance?: number;
  approvedTotal?: number;
  remainder?: number;
  perMember?: number;
}

export function HeavierStormStory({
  members = 1000,
  poolBalance = 20000,
  approvedTotal = 12000,
  remainder = 8000,
  perMember = 8,
}: HeavierStormStoryProps) {
  return (
    <StoryFrame
      headline={`Same ${usd(poolBalance)} pool, a heavier storm — ${usd(approvedTotal)} paid out, ${usd(remainder)} comes home.`}
      context="the heavier-storm variant — the twin of the standard story (policy doc §7 example)"
      resolution={[
        { text: "nobody's payout was clipped (", mono: false },
        { text: usd(approvedTotal), mono: true },
        { text: " approved < ", mono: false },
        { text: usd(poolBalance), mono: true },
        {
          text: " held) — the refund simply shrank. The mutual held its promise both ways.",
          mono: false,
        },
      ]}
    >
      {/* frame 1 — collect: identical to Story 1 frame 1, same scale */}
      <Panel x={40} y={120} width={560} height={260} title="1 — Collect" />
      <MonoLine
        x={56}
        y={188}
        size={13}
        fill="var(--riprap-diagram-muted)"
        segments={numeralSegments(
          "identical frame 1 to the standard story — same scale, so the later drop reads louder",
        )}
      />
      <PoolVessel
        balance={poolBalance}
        maxBalance={poolBalance}
        x={200}
        y={216}
        interiorWidth={144}
        wallHeight={104}
        surfaceStones={3}
      />

      {/* frame 2 — absorb: the heavier storm */}
      <Panel x={640} y={120} width={560} height={260} title="2 — Absorb" />
      <TreasuryPayout
        x={700}
        y={200}
        balance={remainder}
        maxBalance={poolBalance}
        amount={approvedTotal}
        interiorWidth={144}
        wallHeight={88}
      />
      <MonoLine
        x={656}
        y={184}
        size={13}
        fill="var(--riprap-diagram-muted)"
        segments={[
          { text: "approved claims ", mono: false },
          { text: usd(approvedTotal), mono: true },
          { text: " — fill drops further than the standard story's frame 2", mono: false },
        ]}
      />

      {/* frame 3 — return: the shrunken refund */}
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
      <SvgText x={380} y={500} size={44} fill="var(--riprap-funds-ink)" mono anchor="middle">
        {usd(perMember)}
      </SvgText>
      <SvgText x={380} y={532} size={18} fill="var(--riprap-diagram-ink)" anchor="middle">
        per member
      </SvgText>
      <MonoLine
        x={380}
        y={556}
        size={13}
        fill="var(--riprap-diagram-muted)"
        anchor="middle"
        segments={numeralSegments("derived: $8,000 ÷ 1,000 members")}
      />
      <Panel x={640} y={400} width={560} height={260} title="4 — Dissolve" />
      <Dissolution x={780} y={460} interiorWidth={160} wallHeight={116} />

      <Arrow x1={600} y1={250} x2={640} y2={250} color="var(--riprap-funds)" />
      <Arrow x1={600} y1={530} x2={640} y2={530} color="var(--riprap-deliberation)" dashed />
    </StoryFrame>
  );
}
