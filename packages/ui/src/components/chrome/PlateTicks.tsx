import { cn } from "../../lib/utils";

/**
 * `PlateTicks` — the kit's signature finish: registration marks at the four
 * corners of a plate, the way an engineering section drawing registers a
 * detail view. Pure 1px hairlines, no radius, no shadow. The parent plate
 * must be `relative` and must not clip (no overflow-hidden).
 */
export function PlateTicks({ className }: { className?: string }) {
  return (
    <span
      aria-hidden="true"
      data-slot="plate-ticks"
      className={cn("pointer-events-none absolute inset-0", className)}
    >
      <span className="absolute size-2 border-t border-l border-hairline-strong -top-1 -left-1" />
      <span className="absolute size-2 border-t border-r border-hairline-strong -top-1 -right-1" />
      <span className="absolute size-2 border-b border-l border-hairline-strong -bottom-1 -left-1" />
      <span className="absolute size-2 border-b border-r border-hairline-strong -bottom-1 -right-1" />
    </span>
  );
}
