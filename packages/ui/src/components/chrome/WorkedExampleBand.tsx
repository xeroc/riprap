import { useReducedMotion } from "motion/react";
import type * as React from "react";
import { useEffect, useState } from "react";
import { useInView } from "../../hooks/useInView";
import { cn } from "../../lib/utils";

/** --riprap-stagger: one figure settles every 40ms (DESIGN.md § Motion). */
const STAGGER_MS = 40;

/**
 * `WorkedExampleBand` — the pool-math narrative (DESIGN.md § worked-example-band):
 * mostly empty ground; each mono figure arrives one at a time and settles.
 * Data law: figures arrive as props (values already formatted, e.g. via
 * `usd()`); this component never invents a number. Arrival order = prop
 * order; under `prefers-reduced-motion` every figure renders statically.
 */
export interface WorkedExampleFigure {
  /** the figure itself, e.g. "1,000" or "$20,000" */
  value: string;
  /** what the figure is, e.g. "members" */
  caption?: string;
}

export interface WorkedExampleBandProps extends React.ComponentProps<"section"> {
  figures: WorkedExampleFigure[];
  /** band label, e.g. "worked example" */
  label?: string;
}

export function WorkedExampleBand({ figures, label, className, ...props }: WorkedExampleBandProps) {
  const reduced = useReducedMotion();
  const { ref, inView } = useInView<HTMLDivElement>();
  const [shown, setShown] = useState(() => (reduced ? figures.length : 0));

  useEffect(() => {
    if (!inView) return;
    if (reduced) {
      setShown(figures.length);
      return;
    }
    // one figure per stagger slot: settle, then the next appears
    const timers: number[] = figures.map((_, i) =>
      window.setTimeout(() => setShown(i + 1), STAGGER_MS * i),
    );
    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
  }, [inView, reduced, figures.length]);

  return (
    <section
      ref={ref}
      data-slot="worked-example-band"
      className={cn("py-(--riprap-space-section)", className)}
      {...props}
    >
      {label && (
        <p className="mb-(--riprap-space-xl) uppercase tracking-(--riprap-tracking-stamp) text-muted-foreground [font:var(--riprap-mono-label)]">
          {label}
        </p>
      )}
      <ol className="flex flex-col gap-(--riprap-space-xl) md:flex-row md:flex-wrap md:items-end md:gap-(--riprap-space-xl)">
        {figures.map((figure, i) => {
          const visible = shown > i;
          return (
            <li
              key={`${figure.value}-${i}`}
              data-num
              data-arrived={visible}
              className={cn(
                "flex flex-col gap-2 [font:var(--riprap-mono-number-lg)] text-ink transition-[opacity,translate] duration-[160ms] ease-out",
                visible ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
              )}
            >
              <span>{figure.value}</span>
              {figure.caption && (
                <span className="text-muted-foreground [font:var(--riprap-mono-label)] uppercase tracking-(--riprap-tracking-stamp)">
                  {figure.caption}
                </span>
              )}
            </li>
          );
        })}
      </ol>
    </section>
  );
}
