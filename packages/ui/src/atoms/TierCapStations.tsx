import { TIERS, usd } from "../lib/poolMath";
import { MemberStone } from "./MemberStone";
import { SvgText } from "./SvgFrame";

/**
 * Atom: tier-cap — the fee-to-cap relationship, drawn honestly.
 * meta/primitives/atoms/tier-cap.md.
 *
 * Honesty rule: no proportional fee-vs-cap bars (1:100 is a lie compressed or
 * unreadable at 2px). Fee is the stone (size class + printed number); cap is
 * the dashed ceiling + number; the ratio is stated once as text.
 * Columns stay hollow — a ceiling says "cannot exceed", a filled bar says
 * "will receive".
 */
export interface TierCapStationsProps {
  x: number;
  /** station row top — optional when `baseline` is given directly */
  y?: number;
  /** baseline the columns rise from (grid-aligned) */
  baseline?: number;
  /** highlight the chosen tier; others recede to 60% opacity */
  highlight?: "Basic" | "Standard" | "Premium";
  /** compact legend-strip mode: shorter columns */
  compact?: boolean;
}

const STATION_W = 120;
const STATION_GAP = 16;
/** cap column heights — proportional to $1,000/$2,000/$4,000 (same unit, comparable) */
const CAP_HEIGHTS = [36, 72, 144];
const CAP_HEIGHTS_COMPACT = [20, 40, 80];

export function TierCapStations({
  x,
  y = 0,
  baseline,
  highlight,
  compact = false,
}: TierCapStationsProps) {
  const base = baseline ?? y + (compact ? 104 : 168);
  const heights = compact ? CAP_HEIGHTS_COMPACT : CAP_HEIGHTS;

  return (
    <g>
      {TIERS.map((tier, i) => {
        const sx = x + i * (STATION_W + STATION_GAP);
        const recede = highlight !== undefined && tier.name !== highlight;
        const colX = sx + 72;
        const colH = heights[i];
        const opacity = recede ? 0.6 : 1;
        return (
          <g key={tier.name} opacity={opacity}>
            {/* fee stone — size class is the glance channel */}
            <MemberStone
              size={i === 0 ? "S" : i === 1 ? "M" : "L"}
              seed={11 + i}
              x={sx + 32}
              y={base - (i === 0 ? 20 : i === 1 ? 28 : 40)}
              feeTag={usd(tier.fee)}
            />
            {/* hollow payout column — the cap is a ceiling, not a promise */}
            <rect
              x={colX}
              y={base - colH}
              width={40}
              height={colH}
              fill="none"
              stroke="var(--riprap-funds)"
              strokeWidth={3}
              opacity={recede ? 0.6 : 1}
            />
            {/* dashed ceiling at the column top */}
            <line
              x1={colX - 8}
              y1={base - colH}
              x2={colX + 48}
              y2={base - colH}
              stroke="var(--riprap-funds)"
              strokeWidth={3}
              strokeDasharray="8 6"
            />
            <SvgText
              x={colX + 16}
              y={base - colH - 12}
              size={16}
              fill="var(--riprap-funds-ink)"
              mono
              anchor="middle"
            >
              {usd(tier.cap)}
            </SvgText>
            <SvgText
              x={sx + 60}
              y={base + 24}
              size={13}
              fill="var(--riprap-diagram-ink)"
              anchor="middle"
            >
              {tier.name}
            </SvgText>
          </g>
        );
      })}
      {/* the 1:100 relationship, stated once as text — never a bar */}
      <SvgText
        x={x + (STATION_W * 3 + STATION_GAP * 2) / 2}
        y={base + 52}
        size={13}
        fill="var(--riprap-diagram-muted)"
        mono
        anchor="middle"
      >
        fee : cap = 1 : 100 (every tier)
      </SvgText>
    </g>
  );
}
