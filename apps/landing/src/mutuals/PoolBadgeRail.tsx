// The badge rail (copy doc § /mutuals v12): full-height strips rotated 90°,
// side by side, zero spacing — BP26 on the event pink, the kind strip, then
// the founder badge when present. Shared by the directory table
// (/mutuals) and the member surface's joined-pools table (/app); renders
// inside a `p-0` table cell of a `h-24` row.
import { BpBadge } from "../components/BpBadge";
import type { MutualListing } from "./types";

export function PoolBadgeRail({ pool }: { pool: MutualListing }) {
  return (
    <div className="absolute inset-y-0 left-0 flex">
      <div className="relative w-5 overflow-hidden">
        <span aria-hidden="true" className="absolute inset-0 bg-(--bp-2026-pink)" />
        <BpBadge className="absolute top-1/2 left-1/2 w-max -translate-x-1/2 -translate-y-1/2 rotate-90" />
      </div>
      <div className="relative w-5 overflow-hidden border-x border-hairline bg-card">
        <span className="absolute top-1/2 left-1/2 w-max -translate-x-1/2 -translate-y-1/2 rotate-90 px-2 uppercase tracking-(--riprap-tracking-stamp) text-muted-soft [font:var(--riprap-mono-label)]">
          {pool.kind}
        </span>
      </div>
      {pool.badge ? (
        <div className="relative w-5 overflow-hidden bg-accent">
          <span className="absolute top-1/2 left-1/2 w-max -translate-x-1/2 -translate-y-1/2 rotate-90 px-2 py-0.5 text-ink uppercase tracking-(--riprap-tracking-stamp) [font:var(--riprap-mono-label)]">
            {pool.badge}
          </span>
        </div>
      ) : null}
    </div>
  );
}
