import { STONE_SIZES, type StoneSize, stonePoints, stoneRotation } from "../lib/stone";
import { SvgText } from "./SvgFrame";

/**
 * Atom: member-joins — one stone lands in the pile.
 * meta/primitives/atoms/member-joins.md.
 *
 * Data bindings: 1 stone = 1 member (always); tier → size class S/M/L;
 * fee → printed monospace tag (the honest channel; size is the glance channel);
 * rights stake → right-angle bracket tick.
 */
export interface MemberStoneProps {
  size: StoneSize;
  /** deterministic per member — the same stone in every scene */
  seed: number;
  /** grid-aligned position of the stone center */
  x: number;
  y: number;
  /** entry fee printed beside/on the stone, e.g. "$20" */
  feeTag?: string;
  /** rights tick: `rights = 1` minted per member */
  rightsTick?: boolean;
  /** fill override — juror-draw promotes drawn stones to `deliberation` */
  fillColor?: string;
  /** 0–1 opacity (composition.md: non-highlighted elements recede) */
  opacity?: number;
}

export function MemberStone({
  size,
  seed,
  x,
  y,
  feeTag,
  rightsTick = false,
  fillColor = "var(--riprap-stone)",
  opacity = 1,
}: MemberStoneProps) {
  const pts = stonePoints(size, seed)
    .map((p) => `${p.x},${p.y}`)
    .join(" ");
  const rotation = stoneRotation(seed);
  const w = STONE_SIZES[size];
  return (
    <g transform={`translate(${x} ${y}) rotate(${rotation})`} opacity={opacity}>
      <polygon points={pts} fill={fillColor} stroke="var(--riprap-stone-edge)" strokeWidth={3} />
      {/* rotation applies to the tag too — read it as written on the stone */}
      {feeTag ? (
        <SvgText x={0} y={5} size={13} fill="var(--riprap-funds)" mono anchor="middle">
          {feeTag}
        </SvgText>
      ) : null}
      {rightsTick ? (
        <g>
          <path
            d={`M ${w / 2 - 4} ${-w / 2 + 8} h 8 v 8`}
            fill="none"
            stroke="var(--riprap-stone-edge)"
            strokeWidth={3}
          />
          <SvgText x={w / 2 - 2} y={-w / 2 - 4} size={13} fill="var(--riprap-muted)" mono>
            rights = 1
          </SvgText>
        </g>
      ) : null}
    </g>
  );
}
