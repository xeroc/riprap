import { Glyph, SettleGroup, STROKE } from "./Glyph";

/**
 * join — one more member.
 * A row of members; the newest one (harbor-blue) settles in last, beside the
 * others. The crest law: the accent arrives last and stays.
 */
const SQUARE = 14;
const GAP = 6;
const Y = 52;
const X0 = 11;

export function Join() {
  return (
    <Glyph label="one more member settles in" name="join">
      {[0, 1, 2].map((i) => (
        <SettleGroup key={i} delay={i * 0.04}>
          <rect
            x={X0 + i * (SQUARE + GAP)}
            y={Y}
            width={SQUARE}
            height={SQUARE}
            fill="var(--riprap-diagram-stone)"
            stroke="var(--riprap-diagram-stone-edge)"
            strokeWidth={STROKE}
          />
        </SettleGroup>
      ))}
      {/* the newest member — harbor-blue, lands last */}
      <SettleGroup delay={0.16}>
        <rect
          x={X0 + 3 * (SQUARE + GAP)}
          y={Y}
          width={SQUARE}
          height={SQUARE}
          fill="var(--riprap-accent)"
          stroke="var(--riprap-accent)"
          strokeWidth={STROKE}
        />
      </SettleGroup>
    </Glyph>
  );
}
