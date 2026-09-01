import { STONE_SIZES, type StoneSize } from "../lib/stone";
import { Arrow } from "./Arrow";
import { MemberStone } from "./MemberStone";
import { SvgText } from "./SvgFrame";

/**
 * Atom: juror-stake — the dual role: a member stone that also signs up to
 * judge. meta/primitives/atoms/juror-stake.md.
 *
 * One stone, two rings… one ring: the deliberation ring is a *state of the
 * same stone*, not a different character — members judge members. Stake is
 * $10 (confirmed); unstake is bidirectional (revocable); juror fees flow in
 * from claimants.
 */
export interface JurorStoneProps {
  x: number;
  y: number;
  size?: StoneSize;
  /** deterministic per member — the same stone in every scene */
  seed?: number;
  /** entry fee printed on the stone */
  feeTag?: string;
  /** juror stake — $10 confirmed; prints as the chip text */
  stake?: string;
  /** fee inflow glyph — omit in joining scenes, include for juror economics */
  feeInflow?: boolean;
}

export function JurorStone({
  x,
  y,
  size = "M",
  seed = 5,
  feeTag,
  stake = "$10",
  feeInflow = true,
}: JurorStoneProps) {
  const ringR = STONE_SIZES[size] / 2 + 8;
  const chipX = x + ringR + 8;
  const chipY = y + ringR - 8;
  return (
    <g>
      <MemberStone size={size} seed={seed} x={x} y={y} feeTag={feeTag} />
      {/* the opt-in is a state of the same stone */}
      <circle
        cx={x}
        cy={y}
        r={ringR}
        fill="none"
        stroke="var(--riprap-deliberation)"
        strokeWidth={3}
      />
      <SvgText x={x} y={y - ringR - 12} size={13} fill="var(--riprap-deliberation)" anchor="middle">
        juror
      </SvgText>

      {/* stake chip */}
      <rect
        x={chipX}
        y={chipY}
        width={64}
        height={28}
        rx={12}
        fill="var(--riprap-canvas)"
        stroke="var(--riprap-deliberation)"
        strokeWidth={3}
      />
      <SvgText
        x={chipX + 32}
        y={chipY + 19}
        size={13}
        fill="var(--riprap-deliberation)"
        mono
        anchor="middle"
      >
        {stake}
      </SvgText>

      {/* revocable — the arrow says so without a paragraph */}
      <Arrow
        x1={x - ringR - 24}
        y1={y + ringR + 32}
        x2={x + ringR + 24}
        y2={y + ringR + 32}
        color="var(--riprap-muted)"
        both
      />
      <SvgText x={x} y={y + ringR + 60} size={13} fill="var(--riprap-muted)" anchor="middle">
        unstake anytime
      </SvgText>

      {/* juror fees flow from claimants into the ring */}
      {feeInflow ? (
        <g>
          <circle
            cx={x - ringR - 64}
            cy={y - ringR - 8}
            r={10}
            fill="none"
            stroke="var(--riprap-funds)"
            strokeWidth={3}
          />
          <SvgText
            x={x - ringR - 64}
            y={y - ringR - 26}
            size={13}
            fill="var(--riprap-funds)"
            anchor="middle"
          >
            juror fees
          </SvgText>
          <Arrow
            x1={x - ringR - 52}
            y1={y - ringR - 8}
            x2={x - ringR - 6}
            y2={y - ringR + 4}
            color="var(--riprap-funds)"
          />
        </g>
      ) : null}
    </g>
  );
}
