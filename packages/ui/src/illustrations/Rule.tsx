import { Glyph, SettleGroup, STROKE } from "./Glyph";

/**
 * rule — peers decide.
 * Three members; each prints their vote — check (approve) or cross
 * (dissent). The majority carries the decision (deliberation tone).
 * No gavel, no scales — count is the whole idea.
 */
const SQUARE = 14;
const GAP = 9;
const Y = 41;
const X0 = 18;

/** vote marks, drawn inside the square (local coords 0–14): the check
 * knocks out of the deliberation fill in canvas color; the cross runs in
 * the dissent square's own edge color — the majority carries, dissent recedes. */
const CHECK = "M3.5 7 6 9.5 10.4 4";
const CROSS = "M4 4 10 10 M10 4 4 10";

export function Rule() {
  return (
    <Glyph label="peers decide the claim" name="rule">
      {[0, 1, 2].map((i) => {
        const approve = i < 2;
        return (
          <SettleGroup key={i} delay={i * 0.04}>
            <rect
              x={X0 + i * (SQUARE + GAP)}
              y={Y}
              width={SQUARE}
              height={SQUARE}
              fill={approve ? "var(--riprap-deliberation)" : "var(--riprap-diagram-stone)"}
              stroke={approve ? "var(--riprap-deliberation)" : "var(--riprap-diagram-stone-edge)"}
              strokeWidth={STROKE}
            />
            <path
              d={approve ? CHECK : CROSS}
              transform={`translate(${X0 + i * (SQUARE + GAP)} ${Y})`}
              fill="none"
              stroke={approve ? "var(--riprap-diagram-canvas)" : "var(--riprap-diagram-stone-edge)"}
              strokeWidth={STROKE}
            />
          </SettleGroup>
        );
      })}
    </Glyph>
  );
}
