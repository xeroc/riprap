import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { GlyphTile } from "../components/chrome/GlyphTile";
import { Claim } from "./Claim";
import { Gather } from "./Gather";
import { Join } from "./Join";
import { Return } from "./Return";
import { Rule } from "./Rule";

/**
 * LifecycleStrip — the whole product in five single-concept plates:
 * join → gather → rule → claim → liquidate. One line of story, no
 * technical terms; each tile holds exactly one idea. `skipSteps` hides
 * plates by their printed ordinal (the pitch omits the liquidate plate:
 * `skipSteps={[5]}`); kept plates keep their ordinals, no renumbering.
 */
const STEPS = [
  { id: "join", step: "01", label: "one more member", Glyph: Join },
  { id: "gather", step: "02", label: "money gathers", Glyph: Gather },
  { id: "rule", step: "03", label: "peers decide", Glyph: Rule },
  { id: "claim", step: "04", label: "a claim is paid", Glyph: Claim },
  { id: "return", step: "05", label: "liquidate", Glyph: Return },
] as const;

/**
 * Auto-loop cadence — the arrival (longest stagger 0.16s + settle 0.16s)
 * replays indefinitely after a rest of LOOP_BREAK_MS. Reduced motion never
 * loops: the glyph mounts settled and stays.
 */
export const LOOP_BREAK_MS = 3000;
export const AUTO_LOOP_MS = 320 + LOOP_BREAK_MS;

export function LifecycleStrip({ skipSteps = [] }: { skipSteps?: readonly number[] }) {
  const visible = STEPS.filter((tile) => !skipSteps.includes(Number(tile.step)));
  return (
    <ol
      data-slot="lifecycle-strip"
      className={
        visible.length === 4
          ? "grid grid-cols-2 gap-4 sm:grid-cols-4"
          : "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
      }
    >
      {visible.map((tile) => (
        <LifecycleTile key={tile.id} {...tile} />
      ))}
    </ol>
  );
}

/**
 * One plate. The glyph's arrival replays in a loop: each tick remounts it
 * (key bump), re-running the settle-in stagger from its ENTER state, then
 * rests LOOP_BREAK_MS before the next replay — indefinitely. Under reduced
 * motion no interval runs at all.
 */
function LifecycleTile({ id, step, label, Glyph }: (typeof STEPS)[number]) {
  const [run, setRun] = useState(0);
  const reduced = useReducedMotion();

  useEffect(() => {
    if (reduced) return;
    const loop = window.setInterval(() => setRun((r) => r + 1), AUTO_LOOP_MS);
    return () => window.clearInterval(loop);
  }, [reduced]);

  return (
    <li data-step={id}>
      <GlyphTile step={step} label={label}>
        <Glyph key={run} />
      </GlyphTile>
    </li>
  );
}
