import { useReducedMotion } from "motion/react";
import { useEffect, useState } from "react";

import { GlyphTile } from "../components/chrome/GlyphTile";
import { Backstop } from "./Backstop";
import { Found } from "./Found";
import { AUTO_LOOP_MS } from "./LifecycleStrip";
import { OnePool } from "./OnePool";
import { Renew } from "./Renew";
import { Stack } from "./Stack";

/**
 * ExpansionStrip — the steps from one pool to cover for anything, five
 * single-concept plates: one pool → anyone founds one → cover renews →
 * a backstop grows → pools cover pools. Each plate adds exactly one thing;
 * the pool itself never changes shape. `skipSteps` hides plates by their
 * printed ordinal; kept plates keep their ordinals, no renumbering.
 */
const STEPS = [
  { id: "pool", step: "01", label: "one pool", Glyph: OnePool },
  { id: "found", step: "02", label: "anyone founds one", Glyph: Found },
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
 * One plate — the glyph's arrival replays on the strip's shared loop
 * cadence (key bump remounts it, re-running the settle-in stagger).
 * Under reduced motion no interval runs at all.
 */
function ExpansionTile({ id, step, label, Glyph }: (typeof STEPS)[number]) {
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
