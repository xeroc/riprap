import { Glyph, SettleGroup, VesselLines } from "./Glyph";

/**
 * return — what's left returns.
 * The pool stands empty; equal shares settle back out to the members.
 */
const SHARE = 8;
const GAP = 4;
const Y = 78;
const X0 = 14;

export function Return() {
  return (
    <Glyph label="what is left returns to the members" name="return">
      <VesselLines />
      {/* six equal shares, settling back in from the center out */}
      {[0, 1, 2, 3, 4, 5].map((i) => {
        const centerDist = Math.abs(i - 2.5); // 2.5,1.5,.5,.5,1.5,2.5
        return (
          <SettleGroup key={i} delay={(3 - centerDist) * 0.04}>
            <rect
              x={X0 + i * (SHARE + GAP)}
              y={Y}
              width={SHARE}
              height={SHARE}
              fill="var(--riprap-funds)"
            />
          </SettleGroup>
        );
      })}
    </Glyph>
  );
}
