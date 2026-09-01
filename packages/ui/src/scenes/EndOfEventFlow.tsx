import { Arrow } from "../atoms/Arrow";
import { Dissolution } from "../atoms/Dissolution";
import { ProRataRefund } from "../atoms/ProRataRefund";
import { SvgFrame } from "../atoms/SvgFrame";
import { usd } from "../lib/poolMath";
import { MonoLine, Panel, SceneTitle } from "./Panel";

/**
 * Scene 3 — end-of-event flow (composition.md § scene templates, 800×450).
 *
 * Two beats left→right: pro-rata-refund (sliced remainder, crank, formula
 * tag, returning arrows) → dissolution (dashed vessel, $0, dispersing
 * stones). Headline carries the worked figure.
 */
export interface EndOfEventFlowProps {
  /** treasury remainder before slicing */
  remainder?: number;
  /** shared money scale */
  maxBalance?: number;
  /** total members (slice truncation + printed count) */
  members?: number;
  /** per-member refund (worked figure) */
  perMember?: number;
}

export function EndOfEventFlow({
  remainder = 12000,
  maxBalance = 20000,
  members = 1000,
  perMember = 12,
}: EndOfEventFlowProps) {
  const refundX = 64;
  const refundY = 188;
  const dissolveX = 520;
  const dissolveY = 228;

  return (
    <SvgFrame
      width={800}
      height={450}
      title="End of event"
      desc="The permissionless crank returns each member's pro-rata share of the remainder out the liquidation door; then the pool dissolves — dashed vessel, zero balance, stones dispersing, nothing survives."
    >
      <SceneTitle title="End of event" />
      <MonoLine
        x={40}
        y={88}
        size={13}
        fill="var(--riprap-diagram-muted)"
        segments={[
          { text: "claims window closes → crank → dissolve · ", mono: false },
          { text: `${members.toLocaleString("en-US")}`, mono: true },
          { text: " Standard members", mono: false },
        ]}
      />

      {/* the headline — the story's number, display-adjacent weight */}
      <MonoLine
        x={40}
        y={120}
        size={28}
        fill="var(--riprap-funds-ink)"
        bold
        segments={[
          { text: usd(remainder), mono: true },
          { text: " returned — ", mono: false },
          { text: usd(perMember), mono: true },
          { text: " per member", mono: false },
        ]}
      />

      {/* beat 1 — the crank returns each member's share */}
      <Panel x={40} y={140} width={344} height={280} title="refund crank" />
      <ProRataRefund
        x={refundX}
        y={refundY}
        remainder={remainder}
        maxBalance={maxBalance}
        memberCount={members}
        perMember={perMember}
        interiorWidth={128}
        wallHeight={88}
      />

      {/* beat 2 — nothing survives */}
      <Panel x={424} y={140} width={336} height={280} title="dissolve" />
      <Dissolution x={dissolveX} y={dissolveY} interiorWidth={160} wallHeight={116} />

      {/* liquidation door → dissolution (the terminus's only inbound) */}
      <Arrow x1={384} y1={236} x2={424} y2={236} color="var(--riprap-deliberation)" dashed />
    </SvgFrame>
  );
}
