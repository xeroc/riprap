import { fillHeight, usd } from "../lib/poolMath";
import type { StoneSize } from "../lib/stone";
import { Arrow } from "./Arrow";
import { MemberStone } from "./MemberStone";
import { PoolVessel } from "./PoolVessel";
import { SvgText } from "./SvgFrame";

/**
 * Atom: payout-through-treasury — the money leaves through the governed
 * door, not a handout. meta/primitives/atoms/payout-through-treasury.md.
 *
 * The ruling drops into the swig policy card, NOT directly into the money:
 * adjudication writes a policy; the policy moves funds. The member claims
 * (pull, never push). This is the spending door — the liquidation door
 * never carries this money.
 *
 * Layout: policy card above, vessel below, the payout column (cap tick,
 * stream, stone, labels) to the vessel's right — every annotation keeps
 * its own band, so thumbnail frames never collide.
 */
export interface TreasuryPayoutProps {
  x: number;
  y: number;
  /** treasury balance shown in the vessel fragment */
  balance: number;
  /** max balance on this piece's shared money scale */
  maxBalance: number;
  /** approved payout amount printed on the stream */
  amount: number;
  /** tier cap — prints the dashed cap tick above the stream when set */
  tierCap?: number;
  /** receiving member's tier (stone size class) */
  receivingTier?: StoneSize;
  /** shortfall scaling ratio, e.g. `× P / A` — annotated at the stream origin */
  ratioTag?: string;
  interiorWidth?: number;
  wallHeight?: number;
  /** dashed level line + balance label (scenes may relocate the number) */
  levelLine?: boolean;
}

export function TreasuryPayout({
  x,
  y,
  balance,
  maxBalance,
  amount,
  tierCap,
  receivingTier = "M",
  ratioTag,
  interiorWidth = 168,
  wallHeight = 120,
  levelLine = true,
}: TreasuryPayoutProps) {
  const wallR = x + interiorWidth;
  const vesselTop = y + 52;
  const bottom = vesselTop + wallHeight;
  const doorY = bottom - 24; // spending gap center (right wall, lower half)
  const stoneX = x + interiorWidth + 96;
  const stoneY = doorY - 56;
  const level = Math.round(fillHeight(balance, maxBalance, wallHeight - 16) / 4) * 4;
  const fillY = vesselTop + wallHeight - level;

  return (
    <g>
      {/* vessel fragment with the spending door open */}
      <PoolVessel
        balance={balance}
        maxBalance={maxBalance}
        x={x}
        y={vesselTop}
        interiorWidth={interiorWidth}
        wallHeight={wallHeight}
        spendingDoor="open"
        showLevelLine={false}
      />

      {/* the policy card — drawn every time; skipping it turns a governed
          disbursement into a payment from a hand */}
      <rect
        x={x}
        y={y}
        width={180}
        height={44}
        rx={12}
        fill="var(--riprap-canvas)"
        stroke="var(--riprap-deliberation)"
        strokeWidth={3}
      />
      <SvgText x={x + 90} y={y + 18} size={13} fill="var(--riprap-deliberation)" anchor="middle">
        swig policy installed
      </SvgText>
      <SvgText
        x={x + 90}
        y={y + 36}
        size={13}
        fill="var(--riprap-deliberation)"
        mono
        anchor="middle"
      >
        TokenDestinationLimit
      </SvgText>

      {/* dashed cap tick above the stream — the amount may not exceed it */}
      {tierCap ? (
        <g>
          <line
            x1={wallR + 16}
            y1={doorY - 36}
            x2={wallR + 64}
            y2={doorY - 36}
            stroke="var(--riprap-peril)"
            strokeWidth={3}
            strokeDasharray="8 6"
          />
          <SvgText
            x={wallR + 12}
            y={doorY - 80}
            size={13}
            fill="var(--riprap-peril)"
            mono
            anchor="end"
          >
            {`cap ${usd(tierCap)}`}
          </SvgText>
        </g>
      ) : null}

      {/* shortfall ratio annotated at the stream origin */}
      {ratioTag ? (
        <SvgText x={wallR + 8} y={doorY - 24} size={13} fill="var(--riprap-funds)" mono>
          {ratioTag}
        </SvgText>
      ) : null}

      {/* payout stream out the open door, up to the member */}
      <Arrow x1={wallR} y1={doorY} x2={stoneX - 46} y2={stoneY + 12} color="var(--riprap-funds)" />
      <SvgText x={wallR + 60} y={doorY - 4} size={16} fill="var(--riprap-funds)" mono>
        {usd(amount)}
      </SvgText>

      {/* dashed level line + label — the atom's required annotation, on the
          vessel's left where the payout column can never reach it */}
      {levelLine && level > 0 ? (
        <g>
          <line
            x1={x + 3}
            y1={fillY}
            x2={wallR + 36}
            y2={fillY}
            stroke="var(--riprap-funds)"
            strokeWidth={3}
            strokeDasharray="8 6"
          />
          <SvgText x={x - 8} y={fillY + 4} size={16} fill="var(--riprap-funds)" mono anchor="end">
            {usd(balance)}
          </SvgText>
        </g>
      ) : null}

      {/* the receiving member — funds await claim, they are not pushed */}
      <MemberStone size={receivingTier} seed={17} x={stoneX} y={stoneY} />
      <SvgText x={stoneX} y={doorY + 12} size={13} fill="var(--riprap-muted)" anchor="middle">
        member claims
      </SvgText>
    </g>
  );
}
