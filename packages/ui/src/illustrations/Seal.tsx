import { Glyph, SettleGroup, STROKE } from "./Glyph";

/**
 * seal — the terms, written and sealed at creation.
 * The founder's card (sponsor-founds' rule card, glyph scale): outline,
 * four ruled rows, no signature — members sign later, one lane over. The
 * seal (accent, crest law: the binding mark arrives last and stays)
 * overlaps the card's bottom-right corner: what's sealed can't change.
 */
const CARD = { x: 20, y: 14, w: 56, h: 62 };
const ROW = { x1: 30, x2: 66, ys: [28, 36, 44, 52] };
const SEAL = { x: 64, y: 66, w: 14, h: 14 };

export function Seal() {
  return (
    <Glyph label="the terms are written and sealed at creation" name="seal">
      {/* the terms card + its ruled rows — the founder's writing */}
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
      </SettleGroup>
      {/* the seal — accent, settles last over the corner */}
      <SettleGroup delay={0.16}>
        <rect
          x={SEAL.x}
          y={SEAL.y}
          width={SEAL.w}
          height={SEAL.h}
          fill="var(--riprap-accent)"
          stroke="var(--riprap-accent)"
          strokeWidth={STROKE}
        />
      </SettleGroup>
    </Glyph>
  );
}
