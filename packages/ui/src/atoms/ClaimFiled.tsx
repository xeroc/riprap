import { usd } from "../lib/poolMath";
import { Arrow } from "./Arrow";
import { SvgText } from "./SvgFrame";

/**
 * Atom: claim-filed — the storm makes landfall: an incident inside the
 * window, evidence attached, claim opened.
 * meta/primitives/atoms/claim-filed.md.
 *
 * One of the few places peril red is allowed. The incident diamond sits ON
 * the window bracket (position = when; inside the span = qualifying); the
 * three qualifying conditions print as a caption checklist; the claim arrow
 * label must read ≤ the dashed tier cap.
 */
export interface ClaimFiledProps {
  x: number;
  y: number;
  /** panel width the bracket spans (atom is panel-shaped) */
  width?: number;
  /** coverage window — `{{EVENT}}` for generic pools */
  event?: string;
  /** claimed amount in USDC — printed on the claim arrow */
  claimedAmount: number;
  /** the member's tier max — dashed cap line above the claim arrow */
  tierCap: number;
  /** evidence items — one doc glyph per item up to 3, then `+n` */
  evidenceCount?: number;
  /** incident position along the bracket, 0–1 */
  incidentAt?: number;
}

const CONDITIONS = ["within period", "covered area", "active member"];

export function ClaimFiled({
  x,
  y,
  width = 344,
  event = "{{EVENT}}",
  claimedAmount,
  tierCap,
  evidenceCount = 2,
  incidentAt = 0.45,
}: ClaimFiledProps) {
  const bracketL = x + 20;
  const bracketR = x + width - 20;
  const bracketY = y + 64;
  const incidentX = bracketL + Math.round(((bracketR - bracketL) * incidentAt) / 4) * 4;
  const docs = Math.min(3, Math.max(1, evidenceCount));
  const extra = evidenceCount - docs;
  const arrowY = y + 168;
  const arrowX2 = x + width - 84;

  return (
    <g>
      {/* window bracket — time; everything sits on it */}
      <line
        x1={bracketL}
        y1={bracketY}
        x2={bracketR}
        y2={bracketY}
        stroke="var(--riprap-diagram-ink)"
        strokeWidth={3}
      />
      <line
        x1={bracketL}
        y1={bracketY - 8}
        x2={bracketL}
        y2={bracketY + 8}
        stroke="var(--riprap-diagram-ink)"
        strokeWidth={3}
      />
      <line
        x1={bracketR}
        y1={bracketY - 8}
        x2={bracketR}
        y2={bracketY + 8}
        stroke="var(--riprap-diagram-ink)"
        strokeWidth={3}
      />
      <SvgText x={bracketL} y={bracketY + 28} size={13} fill="var(--riprap-diagram-muted)">
        {"coverage window ·"}
      </SvgText>
      <SvgText
        x={bracketL + 132}
        y={bracketY + 28}
        size={13}
        fill="var(--riprap-diagram-muted)"
        mono
      >
        {event}
      </SvgText>

      {/* peril diamond on the bracket — position encodes when */}
      <polygon
        points={`${incidentX},${bracketY - 14} ${incidentX + 14},${bracketY} ${incidentX},${bracketY + 14} ${incidentX - 14},${bracketY}`}
        fill="var(--riprap-peril)"
      />
      <SvgText
        x={incidentX}
        y={bracketY - 24}
        size={13}
        fill="var(--riprap-peril-ink)"
        anchor="middle"
      >
        incident
      </SvgText>

      {/* qualifying conditions — the caption checklist */}
      {CONDITIONS.map((c, i) => {
        const cx = bracketL + i * 112;
        return (
          <g key={c}>
            <path
              d={`M ${cx} ${bracketY + 48} l 6 6 l 10 -12`}
              fill="none"
              stroke="var(--riprap-diagram-muted)"
              strokeWidth={3}
            />
            <SvgText x={cx + 24} y={bracketY + 52} size={13} fill="var(--riprap-diagram-muted)">
              {c}
            </SvgText>
          </g>
        );
      })}

      {/* evidence docs — one glyph per item, tethered to the incident */}
      {Array.from({ length: docs }, (_, i) => {
        const dx = x + width - 64 - i * 20;
        const dy = y + 88 - i * 12;
        return (
          <g key={i}>
            {i === 0 ? (
              <line
                x1={incidentX + 16}
                y1={bracketY + 8}
                x2={dx + 4}
                y2={dy - 4}
                stroke="var(--riprap-diagram-muted)"
                strokeWidth={3}
              />
            ) : null}
            <rect
              x={dx}
              y={dy}
              width={48}
              height={56}
              rx={12}
              fill="var(--riprap-diagram-canvas)"
              stroke="var(--riprap-diagram-ink)"
              strokeWidth={3}
            />
            <line
              x1={dx + 8}
              y1={dy + 20}
              x2={dx + 40}
              y2={dy + 20}
              stroke="var(--riprap-diagram-muted)"
              strokeWidth={3}
            />
            <line
              x1={dx + 8}
              y1={dy + 30}
              x2={dx + 40}
              y2={dy + 30}
              stroke="var(--riprap-diagram-muted)"
              strokeWidth={3}
            />
            <line
              x1={dx + 8}
              y1={dy + 40}
              x2={dx + 32}
              y2={dy + 40}
              stroke="var(--riprap-diagram-muted)"
              strokeWidth={3}
            />
          </g>
        );
      })}
      {extra > 0 ? (
        <SvgText
          x={x + width - 64 - docs * 20 - 12}
          y={y + 120}
          size={16}
          fill="var(--riprap-diagram-muted)"
          mono
        >
          {`+${extra}`}
        </SvgText>
      ) : null}
      <SvgText
        x={x + width - 40}
        y={y + 164}
        size={13}
        fill="var(--riprap-diagram-muted)"
        anchor="middle"
      >
        evidence
      </SvgText>

      {/* dashed tier cap above the claim — the claim may not exceed it */}
      <line
        x1={x + 24}
        y1={arrowY - 16}
        x2={arrowX2}
        y2={arrowY - 16}
        stroke="var(--riprap-peril)"
        strokeWidth={3}
        strokeDasharray="8 6"
      />
      <SvgText x={x + 24} y={arrowY - 24} size={13} fill="var(--riprap-peril-ink)" mono>
        {`tier cap ${usd(tierCap)}`}
      </SvgText>

      {/* the claim arrow toward the pool */}
      <Arrow x1={x + 24} y1={arrowY} x2={arrowX2} y2={arrowY} color="var(--riprap-funds)" />
      <SvgText
        x={(x + 24 + arrowX2) / 2}
        y={arrowY - 4}
        size={16}
        fill="var(--riprap-funds-ink)"
        mono
        anchor="middle"
      >
        {usd(claimedAmount)}
      </SvgText>

      {/* claimant pays the jury before the jury looks */}
      <rect
        x={x + 24}
        y={arrowY + 16}
        width={200}
        height={26}
        rx={12}
        fill="none"
        stroke="var(--riprap-deliberation)"
        strokeWidth={3}
      />
      <SvgText x={x + 36} y={arrowY + 34} size={13} fill="var(--riprap-deliberation)">
        round-1 juror fees prepaid
      </SvgText>
    </g>
  );
}
