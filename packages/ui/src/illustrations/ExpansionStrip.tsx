import { useEffect, useState } from "react";

import { GlyphTile } from "../components/chrome/GlyphTile";
import { Backstop } from "./Backstop";
import { Gather } from "./Gather";
import { HOVER_LOOP_MS } from "./LifecycleStrip";
import { Renew } from "./Renew";
import { Rule } from "./Rule";
import { Stack } from "./Stack";

/**
 * ExpansionStrip — the machines on-chain cover needs, five single-concept
 * plates: money gathers → peers decide → cover renews → a backstop grows →
 * pools cover pools — custody, adjudication, recurrence, reserve capital,
 * reinsurance. `skipSteps` hides plates by their printed ordinal; kept
 * plates keep their ordinals, no renumbering.
 */
const STEPS = [
  { id: "gather", step: "01", label: "money gathers", Glyph: Gather },
  { id: "rule", step: "02", label: "peers decide", Glyph: Rule },
  { id: "renew", step: "03", label: "cover renews", Glyph: Renew },
  { id: "backstop", step: "04", label: "a backstop grows", Glyph: Backstop },
  { id: "stack", step: "05", label: "pools cover pools", Glyph: Stack },
] as const;

export function ExpansionStrip({ skipSteps = [] }: { skipSteps?: readonly number[] }) {
  const visible = STEPS.filter((tile) => !skipSteps.includes(Number(tile.step)));
  return (
    <ol
      data-slot="expansion-strip"
      className={
        visible.length === 4
          ? "grid grid-cols-2 gap-4 sm:grid-cols-4"
          : "grid grid-cols-2 gap-4 sm:grid-cols-3 lg:grid-cols-6"
      }
    >
      {visible.map((tile) => (
        <ExpansionTile key={tile.id} {...tile} />
      ))}
    </ol>
  );
}

/**
 * One plate. While hovered, the glyph's arrival replays in a loop: each
 * tick remounts it (key bump), re-running the settle-in stagger from its
 * ENTER state. On leave it stops and stays arrived.
 */
function ExpansionTile({ id, step, label, Glyph }: (typeof STEPS)[number]) {
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
