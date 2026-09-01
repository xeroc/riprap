import { Arrow } from "../atoms/Arrow";
import { JurorStone } from "../atoms/JurorStone";
import { MemberStone } from "../atoms/MemberStone";
import { PoolVessel } from "../atoms/PoolVessel";
import { SponsorRuleCard } from "../atoms/SponsorRuleCard";
import { SvgFrame, SvgText } from "../atoms/SvgFrame";
import { TierCapStations } from "../atoms/TierCapStations";
import { usd } from "../lib/poolMath";
import { MonoLine, SceneTitle } from "./Panel";

/**
 * Scene 1 — join flow (composition.md § scene templates, 800×450).
 *
 * Three beats left→right: sponsor-founds (empty basin + rule card) →
 * member-joins ×3 (one stone per size class landing, fee arrows into
 * basin.in) → pool-with-level at the recruited balance. tier-cap runs as
 * the legend strip along the bottom; juror-stake as the inset bottom-right.
 * Headline annotation: the worked-example recruitment figure.
 */
export interface JoinFlowProps {
  /** worked-example member count (headline figure) */
  members?: number;
  /** worked-example entry fee */
  fee?: number;
  /** recruited treasury balance */
  balance?: number;
  /** pool target on the shared money scale */
  maxBalance?: number;
  /** coverage window — `{{EVENT}}` for generic pools, pool #1 binds Breakpoint 2026 */
  event?: string;
}

export function JoinFlow({
  members = 1000,
  fee = 20,
  balance = 20000,
  maxBalance = 20000,
  event = "{{EVENT}}",
}: JoinFlowProps) {
  const vesselX = 468;
  const vesselY = 150;
  const vesselW = 156;
  const vesselH = 112;

  return (
    <SvgFrame
      width={800}
      height={450}
      title="Join flow"
      desc="Sponsor founds the mutual with an empty basin and the rule card; members pile in one stone per tier with fee arrows; the pool reaches its recruited balance; a juror inset and the tier legend strip complete the scene."
    >
      <SceneTitle title="Join flow" />
      <MonoLine
        x={40}
        y={88}
        size={13}
        fill="var(--riprap-diagram-muted)"
        segments={[
          { text: "sponsor founds · members pile in · ", mono: false },
          { text: event, mono: true },
        ]}
      />

      {/* beat 1 — the before state: rules + empty basin + sponsor outside */}
      <SponsorRuleCard x={40} y={140} event={event} />

      {/* beat 2 — one stone per size class lands, fee arrows into basin.in */}
      {(
        [
          { size: "S", feeTag: "$10", sx: 500, sy: 76 },
          { size: "M", feeTag: "$20", sx: 556, sy: 72 },
          { size: "L", feeTag: "$40", sx: 612, sy: 60 },
        ] as const
      ).map((s) => (
        <g key={s.feeTag}>
          <MemberStone
            size={s.size}
            seed={s.size.charCodeAt(0)}
            x={s.sx}
            y={s.sy}
            feeTag={s.feeTag}
          />
          <Arrow x1={s.sx} y1={s.sy + 36} x2={s.sx} y2={vesselY - 6} color="var(--riprap-funds)" />
          <SvgText x={s.sx + 8} y={s.sy + 52} size={13} fill="var(--riprap-funds-ink)" mono>
            {s.feeTag}
          </SvgText>
        </g>
      ))}

      {/* beat 3 — the pool at the recruited balance */}
      <PoolVessel
        balance={balance}
        maxBalance={maxBalance}
        x={vesselX}
        y={vesselY}
        interiorWidth={vesselW}
        wallHeight={vesselH}
        surfaceStones={3}
      />
      <MonoLine
        x={40}
        y={316}
        size={16}
        fill="var(--riprap-diagram-ink)"
        segments={[
          { text: members.toLocaleString("en-US"), mono: true },
          { text: " members × ", mono: false },
          { text: usd(fee), mono: true },
          { text: " → ", mono: false },
          { text: usd(balance), mono: true },
          { text: " pool", mono: false },
        ]}
      />

      {/* juror inset — some stones also judge (fee inflow omitted: joining scene) */}
      <JurorStone x={600} y={344} size="S" seed={9} feeInflow={false} />

      {/* tier legend strip along the bottom — Standard highlighted (worked example) */}
      <TierCapStations x={40} baseline={384} compact highlight="Standard" />
    </SvgFrame>
  );
}
