import { Arrow } from "./Arrow";
import { SvgText } from "./SvgFrame";

/**
 * Atom: commit-reveal-vote — two cells, one vote: sealed first, opened
 * second. meta/primitives/atoms/commit-reveal-vote.md.
 *
 * The commit cell is cryptographically boring (nothing leaks: no colors, no
 * checkmarks, no tilt). One row per juror, aligned across both cells — the
 * alignment carries "same juror, later moment". At N > 5: one envelope + ×N.
 * The vote pattern must look contested — all-identical reveals read as
 * preordained.
 */
export type VoteOption = "pay" | "reject";

export interface CommitRevealVoteProps {
  x: number;
  y: number;
  /** per-juror revealed votes, reveal cell only — contested patterns in explainer material */
  votes?: VoteOption[];
  /** dispute option labels (the mutual's question to the jury) */
  options?: [VoteOption, VoteOption];
}

/** Decorative monospace fragments — not claims (spec allows fictional). */
const HASHES = ["#a3f9…", "#77b2…", "#d90c…", "#c41e…", "#8fe2…"];
const SALTS = ["7c21…", "a90f…", "3b7d…", "e55c…", "12aa…"];
const CELL_W = 140;
const CELL_H = 170;
const ROW_H = 48;

export function CommitRevealVote({
  x,
  y,
  votes = ["pay", "reject", "pay"],
  options = ["pay", "reject"],
}: CommitRevealVoteProps) {
  const n = votes.length;
  const compact = n > 5;
  const rows = compact ? 1 : n;
  const commitX = x + 16;
  const revealX = x + 188;

  return (
    <g>
      {/* commit cell — sealed envelopes beside hash fragments */}
      <rect
        x={commitX}
        y={y + 40}
        width={CELL_W}
        height={CELL_H}
        rx={12}
        fill="var(--riprap-diagram-canvas)"
        stroke="var(--riprap-diagram-line)"
        strokeWidth={3}
      />
      <SvgText x={commitX + 12} y={y + 64} size={13} fill="var(--riprap-diagram-muted)" mono>
        commit
      </SvgText>
      {Array.from({ length: rows }, (_, i) => {
        const ry = y + 88 + i * ROW_H;
        return (
          <g key={i}>
            <rect
              x={commitX + 16}
              y={ry}
              width={26}
              height={18}
              fill="var(--riprap-diagram-canvas)"
              stroke="var(--riprap-diagram-ink)"
              strokeWidth={3}
            />
            <polyline
              points={`${commitX + 16},${ry} ${commitX + 29},${ry + 12} ${commitX + 42},${ry}`}
              fill="none"
              stroke="var(--riprap-diagram-ink)"
              strokeWidth={3}
            />
            <SvgText x={commitX + 52} y={ry + 14} size={13} fill="var(--riprap-diagram-muted)" mono>
              {compact ? `×${n}` : HASHES[i % HASHES.length]}
            </SvgText>
          </g>
        );
      })}

      {/* sequencing: all commits before any reveal */}
      <Arrow
        x1={commitX + CELL_W + 8}
        y1={y + 125}
        x2={revealX - 8}
        y2={y + 125}
        color="var(--riprap-deliberation)"
      />
      <SvgText x={x + 172} y={y + 212} size={13} fill="var(--riprap-diagram-muted)" anchor="middle">
        after all commits
      </SvgText>

      {/* reveal cell — same envelopes opened, one chip filled per juror */}
      <rect
        x={revealX}
        y={y + 40}
        width={CELL_W}
        height={CELL_H}
        rx={12}
        fill="var(--riprap-diagram-canvas)"
        stroke="var(--riprap-diagram-line)"
        strokeWidth={3}
      />
      <SvgText x={revealX + 12} y={y + 64} size={13} fill="var(--riprap-diagram-muted)" mono>
        reveal
      </SvgText>
      {Array.from({ length: rows }, (_, i) => {
        const ry = y + 80 + i * ROW_H;
        const vote = compact ? votes[0] : votes[i];
        return (
          <g key={i}>
            <polyline
              points={`${revealX + 16},${ry} ${revealX + 29},${ry - 12} ${revealX + 42},${ry}`}
              fill="none"
              stroke="var(--riprap-diagram-ink)"
              strokeWidth={3}
            />
            {/* the two options side-by-side: a choice pair, not a stack —
                a stacked pair plus salt cannot fit a 48px row */}
            {options.map((opt, oi) => {
              const filled = opt === vote;
              return (
                <g key={opt}>
                  <rect
                    x={revealX + 52 + oi * 44}
                    y={ry - 12}
                    width={40}
                    height={20}
                    rx={12}
                    fill={filled ? "var(--riprap-deliberation)" : "none"}
                    stroke="var(--riprap-diagram-ink)"
                    strokeWidth={3}
                  />
                  <SvgText
                    x={revealX + 72 + oi * 44}
                    y={ry + 3}
                    size={13}
                    fill={filled ? "var(--riprap-diagram-canvas)" : "var(--riprap-diagram-ink)"}
                    anchor="middle"
                  >
                    {opt}
                  </SvgText>
                </g>
              );
            })}
            <SvgText x={revealX + 52} y={ry + 20} size={13} fill="var(--riprap-diagram-muted)" mono>
              {`salt: ${SALTS[i % SALTS.length]}`}
            </SvgText>
          </g>
        );
      })}
    </g>
  );
}
