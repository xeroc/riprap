import { Glyph, SettleGroup, STROKE } from "./Glyph";

/**
 * rule — peers decide.
 * Three members; the majority carries the decision (deliberation tone).
 * No gavel, no scales — count is the whole idea.
 */
const SQUARE = 14;
const GAP = 9;
const Y = 41;
const X0 = 18;

export function Rule() {
  return (
    <Glyph label="peers decide the claim" name="rule">
      {[0, 1, 2].map((i) => (
        <SettleGroup key={i} delay={i * 0.04}>
          <rect
            x={X0 + i * (SQUARE + GAP)}
            y={Y}
            width={SQUARE}
            height={SQUARE}
            fill={i < 2 ? "var(--riprap-deliberation)" : "var(--riprap-diagram-stone)"}
            stroke={i < 2 ? "var(--riprap-deliberation)" : "var(--riprap-diagram-stone-edge)"}
            strokeWidth={STROKE}
          />
        </SettleGroup>
      ))}
    </Glyph>
  );
}
