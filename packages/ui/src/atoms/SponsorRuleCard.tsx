import type { TierName } from "../lib/poolMath";
import { TIERS } from "../lib/poolMath";
import { MemberStone } from "./MemberStone";
import { SvgText } from "./SvgFrame";
import { VesselOutline } from "./VesselOutline";

/**
 * Atom: sponsor-founds — the empty basin and the rule card that defines the
 * mutual. The "before" state every other atom reacts to.
 * meta/primitives/atoms/sponsor-founds.md.
 *
 * The whole message is "nothing here yet but rules": balance $0 ⇒ no fill,
 * vessel stroke at 60% opacity ("not yet live"), and the sponsor stone rests
 * OUTSIDE the rim — the sponsor is not the insurer.
 */
export interface SponsorRuleCardProps {
  x: number;
  y: number;
  /** coverage window — `{{EVENT}}` for generic pools, `Breakpoint 2026` for pool #1 */
  event?: string;
  /** claims window length — undecided in sources, stays a parameter */
  claimsWindow?: string;
  /** peril row text (deadpan register — no dramatization) */
  peril?: string;
  /** covered area row text */
  coveredArea?: string;
}

const ROW_H = 28;

export function SponsorRuleCard({
  x,
  y,
  event = "{{EVENT}}",
  claimsWindow = "{{CLAIMS_WINDOW}}",
  peril = "peril — narrowly defined",
  coveredArea = "covered area",
}: SponsorRuleCardProps) {
  const cardW = 280;
  const cardH = 160;
  const basinW = 112;
  const basinH = 80; // width:height = 1.4
  const basinX = x + cardW + 32;
  const basinY = y + 40;
  const rows = [
    { label: peril, mono: null as string | null },
    { label: coveredArea, mono: null as string | null },
    { label: "coverage window", mono: event },
    { label: "tiers", mono: TIERS.map((t) => t.fee).join("/") },
    { label: "claims window", mono: claimsWindow },
  ];

  return (
    <g>
      {/* rule card — 280×160, one row per sponsor decision, no more */}
      <rect
        x={x}
        y={y}
        width={cardW}
        height={cardH}
        rx={12}
        fill="var(--riprap-canvas)"
        stroke="var(--riprap-line)"
        strokeWidth={3}
      />
      {rows.map((row, i) => {
        const ry = y + 32 + i * ROW_H;
        return (
          <g key={row.label}>
            <path
              d={`M ${x + 16} ${ry - 8} l 8 8 l 14 -16`}
              fill="none"
              stroke="var(--riprap-ink)"
              strokeWidth={3}
            />
            <SvgText x={x + 52} y={ry} size={13} fill="var(--riprap-ink)">
              {row.label}
            </SvgText>
            {row.mono ? (
              <SvgText x={x + 172} y={ry} size={13} fill="var(--riprap-ink)" mono>
                {row.mono}
              </SvgText>
            ) : null}
          </g>
        );
      })}

      {/* empty basin at 60% stroke opacity — balance is $0, not yet live */}
      <VesselOutline x={basinX} y={basinY} width={basinW} height={basinH} strokeOpacity={0.6} />

      {/* sponsor stone outside the rim — the sponsor is not the insurer */}
      <MemberStone size="S" seed={7} x={basinX} y={basinY - 28} />
      <SvgText x={basinX} y={basinY - 48} size={13} fill="var(--riprap-muted)" anchor="middle">
        sponsor
      </SvgText>
    </g>
  );
}

/** Tier names in station order — shared with TierCapStations scenes. */
export const TIER_ORDER: readonly TierName[] = TIERS.map((t) => t.name);
