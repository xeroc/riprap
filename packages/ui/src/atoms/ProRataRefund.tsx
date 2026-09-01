import { fillHeight, usd } from "../lib/poolMath";
import { Arrow } from "./Arrow";
import { MemberStone } from "./MemberStone";
import { SvgText } from "./SvgFrame";
import { VesselOutline } from "./VesselOutline";

/**
 * Atom: pro-rata-refund — the money that was never needed goes home.
 * meta/primitives/atoms/pro-rata-refund.md.
 *
 * The remaining fill redrawn as vertical slices (one pool, many shares;
 * equal stakes ⇒ equal widths), a permissionless crank (no authority glyph —
 * the drawing must not reinsert a treasurer), and the formula printed in
 * every depiction — the atom's proof of honesty.
 */
export interface ProRataRefundProps {
  x: number;
  y: number;
  /** treasury remainder before slicing — the binding */
  remainder: number;
  /** max balance on this piece's shared money scale */
  maxBalance: number;
  /** total member count — slices truncate at 12 + ellipsis, true count printed */
  memberCount?: number;
  /** per-member refund printed on the returning arrows */
  perMember?: number;
  interiorWidth?: number;
  wallHeight?: number;
}

const MAX_SLICES = 12;

export function ProRataRefund({
  x,
  y,
  remainder,
  maxBalance,
  memberCount = 1000,
  perMember,
  interiorWidth = 176,
  wallHeight = 128,
}: ProRataRefundProps) {
  const level = Math.round(fillHeight(remainder, maxBalance, wallHeight - 16) / 4) * 4;
  const fillY = y + wallHeight - level;
  const sliceCount = Math.min(MAX_SLICES, memberCount);
  const sliceW = (interiorWidth - 6) / sliceCount;
  const ellipsis = memberCount > MAX_SLICES;
  const bottom = y + wallHeight;
  /* tiny vessels (story thumbnails) get a compressed tail so the formula
     never lands on the story's resolution line */
  const tiny = wallHeight <= 72;
  const tail = tiny
    ? { arrow: 32, stone: 48, each: 72, crank: 96, formula: 116 }
    : { arrow: 44, stone: 64, each: 92, crank: 116, formula: 140 };

  return (
    <g>
      {/* the sliced remainder — one pool, many shares */}
      {level > 0 ? (
        <g>
          <rect
            x={x + 3}
            y={fillY}
            width={interiorWidth - 6}
            height={level}
            fill="var(--riprap-funds)"
          />
          {Array.from({ length: sliceCount - 1 }, (_, i) => (
            <line
              key={i}
              x1={x + 3 + Math.round(sliceW * (i + 1))}
              y1={fillY}
              x2={x + 3 + Math.round(sliceW * (i + 1))}
              y2={bottom}
              stroke="var(--riprap-canvas)"
              strokeWidth={1}
            />
          ))}
          {ellipsis ? (
            <SvgText
              x={x + interiorWidth / 2}
              y={fillY + 24}
              size={16}
              fill="var(--riprap-canvas)"
              mono
              anchor="middle"
            >
              {"×" + memberCount.toLocaleString("en-US")}
            </SvgText>
          ) : null}
        </g>
      ) : null}

      {/* vessel holds money ⇒ both governed doors labeled, liquidation open */}
      <VesselOutline
        x={x}
        y={y}
        width={interiorWidth}
        height={wallHeight}
        doors
        doorGates={{ spending: "shut", liquidation: "open" }}
      />

      {/* level line + remainder label (pool-with-level's annotation) */}
      {level > 0 ? (
        <>
          <line
            x1={x + 3}
            y1={fillY}
            x2={x + interiorWidth + 24}
            y2={fillY}
            stroke="var(--riprap-funds)"
            strokeWidth={3}
            strokeDasharray="8 6"
          />
          <SvgText
            x={x + interiorWidth + 28}
            y={fillY + 5}
            size={16}
            fill="var(--riprap-funds)"
            mono
          >
            {usd(remainder)}
          </SvgText>
        </>
      ) : (
        <SvgText
          x={x + interiorWidth / 2}
          y={y + wallHeight / 2}
          size={16}
          fill="var(--riprap-muted)"
          mono
          anchor="middle"
        >
          $0
        </SvgText>
      )}

      {/* the permissionless crank — anyone may turn it */}
      <g>
        <circle
          cx={x - 24}
          cy={bottom - 8}
          r={10}
          fill="none"
          stroke="var(--riprap-muted)"
          strokeWidth={3}
        />
        {Array.from({ length: 8 }, (_, i) => {
          const a = (i * Math.PI) / 4;
          return (
            <line
              key={i}
              x1={x - 24 + Math.cos(a) * 10}
              y1={bottom - 8 + Math.sin(a) * 10}
              x2={x - 24 + Math.cos(a) * 15}
              y2={bottom - 8 + Math.sin(a) * 15}
              stroke="var(--riprap-muted)"
              strokeWidth={3}
            />
          );
        })}
      </g>

      {/* returning arrows out the liquidation door, to a stone cluster */}
      <Arrow
        x1={x + interiorWidth / 2}
        y1={bottom + 8}
        x2={x + interiorWidth / 2 - 44}
        y2={bottom + tail.arrow}
        color="var(--riprap-funds)"
      />
      <Arrow
        x1={x + interiorWidth / 2}
        y1={bottom + 8}
        x2={x + interiorWidth / 2 + 44}
        y2={bottom + tail.arrow}
        color="var(--riprap-funds)"
      />
      <MemberStone size="S" seed={51} x={x + interiorWidth / 2 - 44} y={bottom + tail.stone} />
      <MemberStone size="S" seed={52} x={x + interiorWidth / 2 + 44} y={bottom + tail.stone} />
      {perMember !== undefined ? (
        <SvgText
          x={x + interiorWidth / 2}
          y={bottom + tail.each}
          size={16}
          fill="var(--riprap-funds)"
          mono
          anchor="middle"
        >
          {`${usd(perMember)} each`}
        </SvgText>
      ) : null}

      {/* Wide captions run RIGHT from the atom's left edge (crank column),
          never centered on a sub-element — a centered 236px caption on a
          thumbnail vessel spills past any frame's left edge. */}
      <SvgText x={x - 24} y={bottom + tail.crank} size={13} fill="var(--riprap-muted)">
        permissionless crank — anyone may turn it
      </SvgText>

      {/* the formula — printed in every depiction */}
      <SvgText x={x - 24} y={bottom + tail.formula} size={13} fill="var(--riprap-muted)" mono>
        share = user_stake / total_stake × treasury
      </SvgText>
    </g>
  );
}
