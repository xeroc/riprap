import {
  BLUE_INDEX,
  GAP_INDEX,
  RING_SEEDS,
  slotPosition,
  stonePoints,
  stoneRotation,
} from "@riprap/ui";
import { Easing, interpolate } from "remotion";

import { mulberry32 } from "./rand";

/**
 * RingMark — the logomark as a pure function of `frame` (the kit's
 * Logomark uses wall-clock motion; videos need determinism). Same
 * geometry, same seeds, same settle order (clockwise, blue stone last).
 * Brand law: the mark settles or dissolves; it never floats or spins.
 */

const SLOTS = 8;
const STONE_SCALE = 0.55;

/** settle order — clockwise from 12, gap skipped, blue stone LAST (crest law) */
const ORDER: number[] = (() => {
  const order: number[] = [];
  for (let i = 0; i < SLOTS; i++) {
    if (i !== GAP_INDEX && i !== BLUE_INDEX) order.push(i);
  }
  order.push(BLUE_INDEX);
  return order;
})();

const SETTLE_FRAMES = 6; // ~160ms settle law @30fps
const STAGGER_FRAMES = 2.4; // ~40ms stagger law

export function RingMark({
  frame,
  size = 96,
  mode,
}: {
  frame: number;
  size?: number;
  mode: "assemble" | "settled" | "dissolve";
}) {
  return (
    <svg viewBox="0 0 96 96" width={size} height={size} role="img" aria-hidden="true">
      {ORDER.map((slot, i) => {
        const p = slotPosition(slot);
        const blue = slot === BLUE_INDEX;
        const delay = i * STAGGER_FRAMES;

        let transform = `translate(${p.x} ${p.y})`;
        let opacity = 1;

        if (mode === "assemble") {
          const t = interpolate(frame, [delay, delay + SETTLE_FRAMES], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.out(Easing.quad),
          });
          transform = `translate(${p.x} ${p.y - (1 - t) * 18})`;
          opacity = t;
        } else if (mode === "dissolve") {
          // scatter: deterministic per-stone direction/speed, off-frame
          const rand = mulberry32(RING_SEEDS[slot] * 977);
          const angle = rand() * Math.PI * 2;
          const dist = 380 + rand() * 420;
          const t = interpolate(frame, [delay, delay + 26], [0, 1], {
            extrapolateLeft: "clamp",
            extrapolateRight: "clamp",
            easing: Easing.bezier(0.3, 0, 0.6, 1),
          });
          transform = `translate(${p.x + Math.cos(angle) * dist * t} ${p.y + Math.sin(angle) * dist * t}) rotate(${t * (rand() * 60 - 30)})`;
          opacity = 1 - t;
        }

        return (
          <g key={slot} transform={transform} opacity={opacity}>
            <g transform={`scale(${STONE_SCALE}) rotate(${stoneRotation(RING_SEEDS[slot])})`}>
              <polygon
                points={stonePoints("S", RING_SEEDS[slot])
                  .map((pt) => `${pt.x},${pt.y}`)
                  .join(" ")}
                fill={blue ? "var(--riprap-accent)" : "var(--riprap-stone)"}
              />
            </g>
          </g>
        );
      })}
    </svg>
  );
}
