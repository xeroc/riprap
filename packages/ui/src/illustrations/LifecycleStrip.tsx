import { useEffect, useState } from "react";

import { GlyphTile } from "../components/chrome/GlyphTile";
import { Claim } from "./Claim";
import { Gather } from "./Gather";
import { Join } from "./Join";
import { Return } from "./Return";
import { Rule } from "./Rule";

/**
 * LifecycleStrip — the whole product in six single-concept plates:
 * gather → join → claim → rule → return → end. One line of story, no
 * technical terms; each tile holds exactly one idea.
 */
const STEPS = [
  { id: "join", step: "01", label: "one more member", Glyph: Join },
  { id: "gather", step: "02", label: "money gathers", Glyph: Gather },
  { id: "rule", step: "03", label: "peers decide", Glyph: Rule },
  { id: "claim", step: "04", label: "a claim is paid", Glyph: Claim },
  { id: "return", step: "05", label: "liquidate", Glyph: Return },
] as const;

/**
 * Hover-loop period — longest glyph stagger (0.16s) + settle (0.16s) plus a
 * beat of rest before the arrival replays. The one sanctioned loop in the
 * kit: pointer-only, and reduced motion stays settled throughout.
 */
export const HOVER_LOOP_MS = 1200;

export function LifecycleStrip() {
  return (
    <ol
      data-slot="lifecycle-strip"
      className="grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
    >
      {STEPS.map((tile) => (
        <LifecycleTile key={tile.id} {...tile} />
      ))}
    </ol>
  );
}

/**
 * One plate. While hovered, the glyph's arrival replays in a loop: each
 * tick remounts it (key bump), re-running the settle-in stagger from its
 * ENTER state. On leave it stops and stays arrived.
 */
function LifecycleTile({ id, step, label, Glyph }: (typeof STEPS)[number]) {
  const [hover, setHover] = useState(false);
  const [run, setRun] = useState(0);

  useEffect(() => {
    if (!hover) return;
    const loop = window.setInterval(() => setRun((r) => r + 1), HOVER_LOOP_MS);
    return () => window.clearInterval(loop);
  }, [hover]);

  return (
    <li
      data-step={id}
      onMouseEnter={() => {
        setHover(true);
        setRun((r) => r + 1); // first replay is immediate, not after one period
      }}
      onMouseLeave={() => setHover(false)}
    >
      <GlyphTile step={step} label={label}>
        <Glyph key={run} />
      </GlyphTile>
    </li>
  );
}
