import { Dissolution } from "../atoms/Dissolution";
import { ProRataRefund } from "../atoms/ProRataRefund";
import { SvgText } from "../atoms/SvgFrame";
import { TreasuryPayout } from "../atoms/TreasuryPayout";
import { VesselOutline } from "../atoms/VesselOutline";
import { fillHeight, usd } from "../lib/poolMath";
import { MonoLine, Panel } from "../scenes/Panel";
import { StoryFrame } from "./StoryFrame";

/**
 * Story 3 — the worst-case wall (data-stories.md).
 *
 * Headline: Claims can exceed the pool — payouts scale down so the pool
 * never goes negative. The fail-closed story. Frame 1 draws the overdraw as
 * a DASHED peril region hatched ABOVE the rim (never a negative fill, never
 * an overflowing vessel — the mechanism forbids it and so does
 * area-equals-money). Frame 2 prints the scaling formula with the
 * illustrative 12-claim input and the derived $1,666.67 payout.
 */
export interface WorstCaseWallStoryProps {
  poolBalance?: number;
  /** illustrative input: 12 claims at the $2,000 Standard cap */
  claims?: number;
  claimCap?: number;
}

export function WorstCaseWallStory({
  poolBalance = 20000,
  claims = 12,
  claimCap = 2000,
}: WorstCaseWallStoryProps) {
  const approvedTotal = claims * claimCap; // $24,000 — illustrative input
  const scaled = (claimCap * poolBalance) / approvedTotal; // $1,666.67 — derived
  const vesselX = 120;
  const vesselY = 256;
  const vesselW = 200;
  const vesselH = 144;
  const fillMax = vesselH - 16;
  const overdrawH =
    Math.round(fillHeight(approvedTotal - poolBalance, poolBalance, fillMax) / 4) * 4;

  return (
    <StoryFrame
      headline="Claims can exceed the pool — payouts scale down so the pool never goes negative."
      context="the worst-case wall — fail-closed economics (meta/PROJECT.md, policy doc §7)"
      resolution={[
        {
          text: "the wall is double — tier cap above, pool balance below — and shortfall scales ",
          mono: false,
        },
        { text: "every", mono: false },
        {
          text: " payout down proportionally. Members' true worst case: fee spent, payout haircut, nothing more.",
          mono: false,
        },
      ]}
    >
      {/* frame 1 — overdrawn: the dashed peril region ABOVE the rim */}
      <Panel x={40} y={120} width={344} height={440} title="1 — Overdrawn" />
      <PoolAtWall
        x={vesselX}
        y={vesselY}
        w={vesselW}
        h={vesselH}
        balance={poolBalance}
        overdrawH={overdrawH}
      />
      <MonoLine
        x={56}
        y={176}
        size={13}
        fill="var(--riprap-peril)"
        segments={[
          { text: "approved claims ", mono: false },
          { text: "{{A}}", mono: true },
          { text: " — exceeds pool", mono: false },
        ]}
      />
      <SvgText
        x={vesselX + vesselW / 2}
        y={vesselY - 12}
        size={13}
        fill="var(--riprap-peril)"
        mono
        anchor="middle"
      >
        A &gt; P
      </SvgText>

      {/* frame 2 — scale down: every payout × P / A */}
      <Panel x={428} y={120} width={344} height={440} title="2 — Scale down" />
      <TreasuryPayout
        x={460}
        y={216}
        balance={0}
        maxBalance={poolBalance}
        amount={scaled}
        tierCap={claimCap}
        ratioTag="× P / A"
        interiorWidth={144}
        wallHeight={104}
      />
      <MonoLine
        x={444}
        y={428}
        size={13}
        fill="var(--riprap-muted)"
        segments={[{ text: "payout = min(tier cap, amount) × P / A", mono: true }]}
      />
      <MonoLine
        x={444}
        y={452}
        size={13}
        fill="var(--riprap-muted)"
        segments={[
          { text: `${claims}`, mono: true },
          { text: " claims × ", mono: false },
          { text: usd(claimCap), mono: true },
          {
            text: ` = ${usd(approvedTotal)} (illustrative)`,
            mono: false,
          },
        ]}
      />
      <MonoLine
        x={444}
        y={476}
        size={13}
        fill="var(--riprap-funds)"
        segments={[
          { text: `${usd(claimCap)} × 20/24 = `, mono: true },
          { text: usd(scaled), mono: true },
          { text: " (derived; caps and pool are doc figures)", mono: false },
        ]}
      />

      {/* frame 3 — empty and done */}
      <Panel x={816} y={120} width={344} height={440} title="3 — Empty and done" />
      <SvgText x={832} y={176} size={13} fill="var(--riprap-muted)">
        no refund slice to draw — $0 returned
      </SvgText>
      <Dissolution x={980} y={240} interiorWidth={112} wallHeight={80} stoneCount={5} />
      <ProRataRefund
        x={856}
        y={372}
        remainder={0}
        maxBalance={poolBalance}
        memberCount={1}
        interiorWidth={88}
        wallHeight={64}
      />
    </StoryFrame>
  );
}

/** Frame 1's vessel: full to the rim, overdraw hatched above it — dashed, peril. */
function PoolAtWall({
  x,
  y,
  w,
  h,
  balance,
  overdrawH,
}: {
  x: number;
  y: number;
  w: number;
  h: number;
  balance: number;
  overdrawH: number;
}) {
  const hatchY = y - overdrawH;
  return (
    <g>
      <rect
        x={x + 3}
        y={y + h - (h - 16)}
        width={w - 6}
        height={h - 16}
        fill="var(--riprap-funds)"
      />
      <VesselOutline
        x={x}
        y={y}
        width={w}
        height={h}
        doors
        doorGates={{ spending: "open", liquidation: "shut" }}
      />
      {/* the overdraw region — a dashed peril boundary above the rim, hatched */}
      <rect
        x={x}
        y={hatchY}
        width={w}
        height={overdrawH}
        fill="none"
        stroke="var(--riprap-peril)"
        strokeWidth={3}
        strokeDasharray="8 6"
      />
      {[0.25, 0.5, 0.75].map((t) => (
        <line
          key={t}
          x1={x + t * w - 8}
          y1={y}
          x2={x + t * w + 8}
          y2={hatchY}
          stroke="var(--riprap-peril)"
          strokeWidth={3}
          strokeDasharray="8 6"
        />
      ))}
      <SvgText
        x={x + w / 2}
        y={y + h - 72}
        size={16}
        fill="var(--riprap-canvas)"
        mono
        anchor="middle"
      >
        {usd(balance)}
      </SvgText>
    </g>
  );
}
