import { Glyph, SettleGroup, STROKE } from "./Glyph";

/**
 * sign — every member signs the terms.
 * The terms card (sponsor-founds' rule card, glyph scale): outline, three
 * ruled rows, one baseline. The signature settles onto it last, in the
 * accent — the crest law: the binding mark arrives last and stays.
 */
const CARD = { x: 20, y: 10, w: 56, h: 68 };
const ROW = { x1: 30, x2: 66, ys: [24, 32, 40] };
const BASELINE = { x1: 26, x2: 70, y: 60 };

/** the signature — one unbroken stroke over the baseline */
const SIGNATURE =
  "M28 58 C33 46 38 46 40 55 C42 63 48 62 51 53 C53 47 57 48 56 55 C55 60 63 58 68 52";

export function Sign() {
  return (
    <Glyph label="every member signs the terms" name="sign">
      {/* the terms card + its ruled rows */}
      <SettleGroup>
        <rect
          x={CARD.x}
          y={CARD.y}
          width={CARD.w}
          height={CARD.h}
          fill="none"
          stroke="var(--riprap-diagram-line)"
          strokeWidth={STROKE}
        />
        {ROW.ys.map((y) => (
          <line
            key={y}
            x1={ROW.x1}
            y1={y}
            x2={ROW.x2}
            y2={y}
            stroke="var(--riprap-diagram-line)"
            strokeWidth={2}
          />
        ))}
        <line
          x1={BASELINE.x1}
          y1={BASELINE.y}
          x2={BASELINE.x2}
          y2={BASELINE.y}
          stroke="var(--riprap-diagram-line)"
          strokeWidth={2}
        />
      </SettleGroup>
      {/* the signature — accent, settles last */}
      <SettleGroup delay={0.16}>
        <path d={SIGNATURE} fill="none" stroke="var(--riprap-accent)" strokeWidth={STROKE} />
      </SettleGroup>
    </Glyph>
  );
}
