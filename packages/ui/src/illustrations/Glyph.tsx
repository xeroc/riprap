import { motion, useReducedMotion } from "motion/react";
import { createContext, type ReactNode, useContext } from "react";
import { useInView } from "../hooks/useInView";
import { cn } from "../lib/utils";

/*
 * The illustration system, redone — DESIGN.md + user law:
 *  - ONE concept per glyph, no technical terms, no numerals inside drawings.
 *  - rectangles and straight lines only — zero rounded geometry anywhere.
 *  - colors only via diagram tokens (--riprap-diagram-*, --riprap-funds,
 *    --riprap-deliberation); money = funds, adjudication = deliberation.
 *  - motion: settle, not slide — 160ms ease-out quart, 40ms stagger,
 *    position/opacity only, once on viewport arrival. Reduced motion
 *    renders the settled state.
 */

/** --riprap-settle */
export const SETTLE = 0.16;
/** --riprap-stagger */
export const STAGGER = 0.04;
/** ease-out quart — matches tokens.css --riprap-settle curve */
export const SETTLE_EASE = [0.215, 0.61, 0.355, 1] as const;

/** illustration stroke weight (meta/primitives/composition.md: stroke 3) */
export const STROKE = 3;

/** settle transition for one arriving element */
export function settle(delay = 0) {
  return { duration: SETTLE, delay, ease: SETTLE_EASE } as const;
}

/** enter state: 12px above, invisible. The settled state is always {y:0, opacity:1}. */
export const ENTER = { opacity: 0, y: -12 } as const;
export const SETTLED = { opacity: 1, y: 0 } as const;

/** arrival signal for the glyph's elements — true once its frame is in view */
const GlyphViewContext = createContext(true);

export function useGlyphInView() {
  return useContext(GlyphViewContext);
}

export interface GlyphProps {
  /** plain-word concept for a11y — e.g. "money gathers". Never shown visually. */
  label: string;
  /** glyph id for tests/CT — e.g. "gather" */
  name: string;
  className?: string;
  children: ReactNode;
}

/** Frame: the 96×96 drawing field every glyph shares; owns arrival. */
export function Glyph({ label, name, className, children }: GlyphProps) {
  const { ref, inView } = useInView<SVGSVGElement>();
  return (
    <GlyphViewContext.Provider value={inView}>
      <svg
        ref={ref}
        viewBox="0 0 96 96"
        role="img"
        aria-label={label}
        data-glyph={name}
        className={cn("block size-full", className)}
      >
        {children}
      </svg>
    </GlyphViewContext.Provider>
  );
}

/**
 * Shared motion wrapper: one arriving group — drops 12px and stops, once,
 * when its glyph scrolls into view. Under reduced motion it renders settled.
 */
export function SettleGroup({ delay = 0, children }: { delay?: number; children: ReactNode }) {
  const reduced = useReducedMotion();
  const inView = useGlyphInView();
  return (
    <motion.g
      initial={reduced ? SETTLED : ENTER}
      animate={inView ? SETTLED : ENTER}
      transition={reduced ? { duration: 0 } : settle(delay)}
    >
      {children}
    </motion.g>
  );
}

/*
 * The vessel — one open-top U. The only repeated shape in the system:
 * every dollar in the story is inside it or visibly leaving it.
 * Interior 26..70 across, floor at 70, stroke 3, butt caps (sharp).
 */
export const VESSEL = {
  leftX: 26,
  rightX: 70,
  topY: 30,
  floorY: 70,
  /** fill rect inside the walls (level 1 = full interior) */
  fill: { x: 27.5, width: 41, floorY: 68.5, fullHeight: 37 },
} as const;

/** The vessel outline as three lines (left wall, floor, right wall). */
export function VesselLines({ door = false }: { door?: boolean }) {
  const { leftX, rightX, topY, floorY } = VESSEL;
  const doorTop = 50;
  const doorBottom = 58;
  return (
    <>
      {/* left wall */}
      <line
        x1={leftX}
        y1={topY}
        x2={leftX}
        y2={floorY}
        stroke="var(--riprap-diagram-line)"
        strokeWidth={STROKE}
      />
      {/* floor */}
      <line
        x1={leftX}
        y1={floorY}
        x2={rightX}
        y2={floorY}
        stroke="var(--riprap-diagram-line)"
        strokeWidth={STROKE}
      />
      {/* right wall — split by the door gap when open */}
      {door ? (
        <>
          <line
            x1={rightX}
            y1={topY}
            x2={rightX}
            y2={doorTop}
            stroke="var(--riprap-diagram-line)"
            strokeWidth={STROKE}
          />
          <line
            x1={rightX}
            y1={doorBottom}
            x2={rightX}
            y2={floorY}
            stroke="var(--riprap-diagram-line)"
            strokeWidth={STROKE}
          />
        </>
      ) : (
        <line
          x1={rightX}
          y1={topY}
          x2={rightX}
          y2={floorY}
          stroke="var(--riprap-diagram-line)"
          strokeWidth={STROKE}
        />
      )}
    </>
  );
}
