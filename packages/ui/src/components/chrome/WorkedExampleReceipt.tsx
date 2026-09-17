import { useInView, useReducedMotion } from "motion/react";
import type * as React from "react";
import { useEffect, useRef, useState } from "react";
import { useGlyphClock } from "../../illustrations/Glyph";
import { settleAt } from "../../lib/settle";
import { cn } from "../../lib/utils";

/** --riprap-stagger default: one line settles every 40ms (DESIGN.md § Motion). */
const STAGGER_MS = 40;

/**
 * `WorkedExampleReceipt` — the pool math as a bill (DESIGN.md §
 * worked-example-receipt): line items on dotted leaders, the closing figure
 * set off under a hairline rule like a total. Each line arrives one at a
 * time and settles; the total arrives last.
 *
 * Data law: lines arrive as props (values already formatted, e.g. via
 * `usd()`); this component never invents a number. Under
 * `prefers-reduced-motion` every line renders statically.
 */
export interface WorkedExampleLine {
  /** the figure itself, e.g. "1,000" or "4 × $2,000" */
  value: string;
  /** what the figure is, e.g. "members" */
  caption?: string;
}

export interface WorkedExampleReceiptProps extends React.ComponentProps<"section"> {
  /** line items in reading order */
  lines: WorkedExampleLine[];
  /** the closing figure — set off under a hairline rule, arrives last */
  total?: WorkedExampleLine;
  /** receipt header, e.g. "worked example" */
  label?: string;
  /** ms between line arrivals — the video lane slows this to reading pace */
  staggerMs?: number;
}

export function WorkedExampleReceipt({
  lines,
  total,
  label,
  staggerMs = STAGGER_MS,
  className,
  ...props
}: WorkedExampleReceiptProps) {
  const clock = useGlyphClock();
  const reduced = useReducedMotion();
  const ref = useRef<HTMLElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const count = lines.length + (total ? 1 : 0);
  const [shown, setShown] = useState(() => (reduced ? count : 0));

  useEffect(() => {
    if (clock || !inView) return;
    if (reduced) {
      setShown(count);
      return;
    }
    // one line per stagger slot: settle, then the next appears
    const timers: number[] = Array.from({ length: count }, (_, i) =>
      window.setTimeout(() => setShown(i + 1), staggerMs * i),
    );
    return () => {
      for (const t of timers) window.clearTimeout(t);
    };
  }, [clock, inView, reduced, count, staggerMs]);

  /** settle-law arrival for entry `i` (0-based across lines, then total):
   * clock lane is frame-exact; web lane transitions and flips data-arrived. */
  const arrive = (i: number) => {
    const p = clock ? settleAt(clock.frame / clock.fps, (i * staggerMs) / 1000) : shown > i ? 1 : 0;
    if (clock) {
      return {
        arrived: p > 0,
        className: undefined,
        style: { opacity: p, transform: `translateY(${(1 - p) * -8}px)` },
      };
    }
    return {
      arrived: p > 0,
      className: p > 0 ? "translate-y-0 opacity-100" : "-translate-y-2 opacity-0",
      style: undefined,
    };
  };

  const caption = (text: string) => (
    <span className="text-muted-foreground [font:var(--riprap-mono-label)] uppercase tracking-(--riprap-tracking-stamp)">
      {text}
    </span>
  );

  return (
    <section
      ref={ref}
      data-slot="worked-example-receipt"
      className={cn("w-fit rounded-none border border-hairline bg-card p-8", className)}
      {...props}
    >
      {label && (
        <p className="mb-4 border-b border-hairline pb-4 uppercase tracking-(--riprap-tracking-stamp) text-muted-foreground [font:var(--riprap-mono-label)]">
          {label}
        </p>
      )}
      <ol className="flex w-full flex-col gap-(--riprap-space-sm)">
        {lines.map((line, i) => {
          const a = arrive(i);
          return (
            <li
              key={`${line.value}-${i}`}
              data-num
              data-arrived={a.arrived}
              className={cn(
                "flex items-baseline gap-4",
                clock ? undefined : "transition-[opacity,translate] duration-[160ms] ease-out",
                a.className,
              )}
              style={a.style}
            >
              {line.caption && caption(line.caption)}
              <span
                aria-hidden="true"
                className="mx-1 min-w-8 flex-1 self-center border-b border-dotted border-hairline-soft"
              />
              <span className="[font:var(--riprap-mono-number)] text-ink">{line.value}</span>
            </li>
          );
        })}
      </ol>
      {total &&
        (() => {
          const a = arrive(lines.length);
          return (
            <div
              data-total
              data-num
              data-arrived={a.arrived}
              className={cn(
                "mt-5 flex items-baseline justify-between gap-4 border-t border-hairline pt-4",
                clock ? undefined : "transition-[opacity,translate] duration-[160ms] ease-out",
                a.className,
              )}
              style={a.style}
            >
              {total.caption && caption(total.caption)}
              <span className="[font:var(--riprap-mono-number-lg)] text-ink">{total.value}</span>
            </div>
          );
        })()}
    </section>
  );
}
