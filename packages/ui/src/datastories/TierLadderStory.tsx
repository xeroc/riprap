import { MemberStone } from "../atoms/MemberStone";
import { SvgText } from "../atoms/SvgFrame";
import { TierCapStations } from "../atoms/TierCapStations";
import { VesselOutline } from "../atoms/VesselOutline";
import { MonoLine } from "../scenes/Panel";
import { StoryFrame } from "./StoryFrame";

/**
 * Story 4 — the 1:100 ladder (data-stories.md).
 *
 * Headline: Ten dollars of risk, a thousand of cover — and the fee is the
 * ceiling, not the price. Source: policy doc §5 tier table (the only
 * allowed prices). Explicitly not a sales pitch: the ratio is stated, the
 * worst case printed beside it. Say "1:100 fee-to-cap", never "leverage".
 */
export interface TierLadderStoryProps {
  /** the highlighted tier (Standard = the worked-example numbers) */
  highlight?: "Basic" | "Standard" | "Premium";
}

export function TierLadderStory({ highlight = "Standard" }: TierLadderStoryProps) {
  return (
    <StoryFrame
      headline="Ten dollars of risk, a thousand of cover — and the fee is the ceiling, not the price."
      context="the 1:100 ladder — the only allowed prices (policy doc §5 tier table)"
      resolution={[
        { text: "the entry fee is the member's ", mono: false },
        { text: "maximum contribution", mono: false },
        {
          text: ", not a sunk premium (policy doc §9) — the unused part returns. Say ",
          mono: false,
        },
        { text: "1:100 fee-to-cap", mono: true },
        { text: ", never “leverage”.", mono: false },
      ]}
    >
      {/* the three stations — hollow columns, dashed ceilings, ratio tag */}
      <TierCapStations x={392} y={148} highlight={highlight} />

      {/* the worst-case pair — both quotes from meta/PROJECT.md */}
      <MonoLine
        x={40}
        y={424}
        size={18}
        fill="var(--riprap-ink)"
        segments={[{ text: "the worst case, printed beside the ratio", mono: false }]}
      />
      <g>
        <MemberStone size="M" seed={31} x={176} y={496} feeTag="$20" />
        <SvgText x={176} y={560} size={16} fill="var(--riprap-peril)" mono anchor="middle">
          $20 gone
        </SvgText>
        <SvgText x={176} y={584} size={13} fill="var(--riprap-muted)" anchor="middle">
          worst case, member — the fee is the maximum contribution
        </SvgText>
      </g>
      <g>
        <VesselOutline x={824} y={452} width={144} height={104} />
        <SvgText x={896} y={508} size={16} fill="var(--riprap-muted)" mono anchor="middle">
          $0
        </SvgText>
        <SvgText x={896} y={584} size={13} fill="var(--riprap-muted)" anchor="middle">
          worst case, pool — empty
        </SvgText>
      </g>
    </StoryFrame>
  );
}
