import { Arrow } from "./Arrow";
import { SvgText } from "./SvgFrame";

/**
 * Atom: ruling — the converge: revealed votes collapse into one outcome,
 * incoherent stakes are slashed, a losing party can force a bigger jury.
 * meta/primitives/atoms/ruling.md.
 *
 * Rays all the same weight — convergence, not persuasion. The settlement
 * pair pays coherent jurors and slashes incoherent ones (fraction is
 * `{{SLASH_FRACTION}}`, undefined in sources — never drawn as a number).
 * The appeal ladder 3 → 7 → 15 → 31 is drawn in every full depiction.
 */
export interface RulingProps {
  x: number;
  y: number;
  /** the ruling option that won — both outcomes are legitimate drawings */
  outcome?: "pay" | "reject";
  /** vote tally [winner, loser] — printed `2–1` style and drives ray count */
  tally?: [number, number];
  /** appeal round 0–3 — highlights the ladder rung (3·2^r − 1) */
  appealRound?: number;
}

const LADDER = [3, 7, 15, 31];

export function Ruling({ x, y, outcome = "pay", tally = [2, 1], appealRound = 0 }: RulingProps) {
  const jurors = tally[0] + tally[1];
  const dotX = x + 52;
  const chipX = x + 152;
  const chipY = y + 108;

  return (
    <g>
      {/* one ray per juror, same weight, converging on the majority */}
      {Array.from({ length: jurors }, (_, i) => {
        const dy = y + 64 + i * (88 / Math.max(1, jurors - 1));
        return (
          <g key={i}>
            <circle cx={dotX} cy={dy} r={9} fill="var(--riprap-deliberation)" />
            <line
              x1={dotX + 9}
              y1={dy}
              x2={chipX - 8}
              y2={chipY + (i - (jurors - 1) / 2) * 12}
              stroke="var(--riprap-deliberation)"
              strokeWidth={3}
            />
          </g>
        );
      })}

      {/* outcome chip — the ruling + the tally */}
      <rect
        x={chipX}
        y={chipY - 24}
        width={150}
        height={48}
        rx={12}
        fill="var(--riprap-canvas)"
        stroke="var(--riprap-deliberation)"
        strokeWidth={3}
      />
      <SvgText
        x={chipX + 75}
        y={chipY - 2}
        size={18}
        fill="var(--riprap-deliberation)"
        bold
        anchor="middle"
      >
        {outcome}
      </SvgText>
      <SvgText
        x={chipX + 75}
        y={chipY + 16}
        size={13}
        fill="var(--riprap-muted)"
        mono
        anchor="middle"
      >
        {`${tally[0]}\u2013${tally[1]}`}
      </SvgText>

      {/* settlement pair — coherent earn fees, incoherent lose a fraction */}
      <SvgText x={dotX + 8} y={y + 48} size={13} fill="var(--riprap-funds)">
        + fees
      </SvgText>
      <Arrow
        x1={chipX + 40}
        y1={chipY - 28}
        x2={dotX + 24}
        y2={y + 52}
        color="var(--riprap-funds)"
      />
      <SvgText x={x + 16} y={y + 188} size={13} fill="var(--riprap-peril)" mono>
        {"\u2212 stake \u00d7 {{SLASH_FRACTION}}"}
      </SvgText>
      <Arrow
        x1={chipX + 12}
        y1={chipY + 28}
        x2={x + 128}
        y2={y + 180}
        color="var(--riprap-peril)"
      />

      {/* appeal ladder — doubling is the anti-bribery mechanism */}
      <SvgText x={x + 328} y={y + 56} size={13} fill="var(--riprap-muted)" anchor="end">
        appeal: 2N+1
      </SvgText>
      <line
        x1={x + 288}
        y1={y + 72}
        x2={x + 328}
        y2={y + 48}
        stroke="var(--riprap-muted)"
        strokeWidth={3}
        strokeDasharray="8 6"
      />
      {LADDER.map((size, i) => {
        const rungX = x + 148 + i * 48;
        const active = i === appealRound;
        return (
          <g key={size}>
            {i > 0 ? (
              <SvgText
                x={rungX - 14}
                y={y + 204}
                size={13}
                fill="var(--riprap-muted)"
                anchor="middle"
              >
                →
              </SvgText>
            ) : null}
            <SvgText
              x={rungX}
              y={y + 204}
              size={13}
              fill={active ? "var(--riprap-ink)" : "var(--riprap-muted)"}
              bold={active}
              mono
              anchor="middle"
            >
              {String(size)}
            </SvgText>
          </g>
        );
      })}
    </g>
  );
}
