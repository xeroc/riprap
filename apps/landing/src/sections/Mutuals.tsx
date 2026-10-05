// §1.2 — MUTUALS: the directory band right below the hero (copy doc §1.2).
// A scroll-snap carousel of cards — one per pool — with the pool's real tier
// numbers (policy §5), deterministic demo stats (placeholder, NOT FOR
// DEPLOY), and a rotation of the supporter discs. "Show all" routes to
// #/mutuals, the tabular directory. Native scroll keeps the carousel
// interruptible by construction; the buttons scroll by one card, smooth
// unless reduced motion.

import { Button, SectionBand } from "@riprap/ui";
import { useReducedMotion } from "motion/react";
import { useRef } from "react";

import { Settle } from "../components/Settle";
import { capRange, demoStats, entryRange, MUTUALS, supportersFor } from "../mutuals/data";
import type { MutualListing } from "../mutuals/types";

const CARD_STEP = 336; // card width (w-80 = 320) + gap-4 (16)

function CardDiscs({ pool }: { pool: MutualListing }) {
  const list = supportersFor(pool);
  if (list.length === 0) return null;
  return (
    <div className="flex items-center -space-x-2">
      {list.map((s) => (
        <a
          key={s.url}
          href={s.url}
          target="_blank"
          rel="noopener noreferrer"
          title={`@${s.handle}`}
          aria-label={`@${s.handle} — their post`}
          className="relative z-0 inline-block rounded-full transition-transform duration-(--riprap-settle) ease-out hover:z-10 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring motion-reduce:transition-none"
        >
          {s.avatar ? (
            <img
              src={s.avatar}
              alt={`@${s.handle}`}
              width={32}
              height={32}
              loading="lazy"
              className="h-8 w-8 rounded-full border border-hairline-strong bg-surface-card object-cover object-center"
            />
          ) : (
            <span className="flex h-8 w-8 items-center justify-center rounded-full border border-hairline-strong bg-surface-card font-mono text-xs text-muted-foreground">
              {s.handle.slice(0, 2).toUpperCase()}
            </span>
          )}
        </a>
      ))}
    </div>
  );
}

function PoolCard({ pool }: { pool: MutualListing }) {
  const stats = demoStats(pool);
  return (
    <article className="flex w-72 shrink-0 snap-start flex-col gap-4 border border-hairline bg-surface-card p-5 sm:w-80">
      <div className="flex items-baseline justify-between gap-3">
        <h3 className="tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-sm)]">
          {pool.name}
        </h3>
        <p className="shrink-0 uppercase tracking-(--riprap-tracking-stamp) text-muted-soft [font:var(--riprap-mono-label)]">
          {pool.status}
        </p>
      </div>
      <p className="leading-relaxed text-body [font:var(--riprap-body-sm)]">{pool.tagline}</p>
      <dl className="flex flex-col gap-1.5 border-t border-hairline pt-3 font-mono text-sm">
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">entry</dt>
          <dd data-num className="text-ink">
            {entryRange(pool)}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">cover</dt>
          <dd data-num className="text-ink">
            {capRange(pool)}
          </dd>
        </div>
        {/* demo stats — placeholder numbers, see data.ts demoStats */}
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">members</dt>
          <dd data-num className="text-ink">
            {stats.members}
          </dd>
        </div>
        <div className="flex items-baseline justify-between gap-4">
          <dt className="text-muted-foreground">pool</dt>
          <dd data-num className="text-ink">
            ${stats.pool.toLocaleString("en-US")}
          </dd>
        </div>
      </dl>
      <div className="mt-auto flex items-center justify-between gap-3 pt-1">
        <CardDiscs pool={pool} />
        {pool.href ? (
          <a
            href={pool.href}
            className="shrink-0 text-accent underline underline-offset-4 [font:var(--riprap-body-sm)]"
          >
            View the pool
          </a>
        ) : (
          <p className="shrink-0 text-muted-soft [font:var(--riprap-mono-label)]">
            policy in review
          </p>
        )}
      </div>
    </article>
  );
}

export function Mutuals() {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();

  const scrollBy = (direction: 1 | -1) => {
    trackRef.current?.scrollBy({
      left: direction * CARD_STEP,
      behavior: reduce ? "auto" : "smooth",
    });
  };

  return (
    <SectionBand id="mutuals" label="mutuals" tone="ground">
      <Settle className="flex flex-col gap-(--riprap-space-xl)">
        <div className="flex flex-wrap items-end justify-between gap-6">
          <div className="flex max-w-2xl flex-col gap-4">
            <h2 className="tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-lg)]">
              The mutuals.
            </h2>
            <p className="leading-relaxed text-muted-foreground [font:var(--riprap-body-md)]">
              One card per pool. The first batch runs at Breakpoint 2026, London.
            </p>
          </div>
          <div className="flex items-center gap-2">
            <Button
              variant="outline"
              size="sm"
              aria-label="Previous pools"
              onClick={() => scrollBy(-1)}
            >
              ←
            </Button>
            <Button variant="outline" size="sm" aria-label="More pools" onClick={() => scrollBy(1)}>
              →
            </Button>
            <Button asChild size="sm" className="ml-2">
              <a href="#/mutuals">Show all</a>
            </Button>
          </div>
        </div>

        <div
          ref={trackRef}
          className="flex snap-x snap-mandatory gap-4 overflow-x-auto pb-2"
          tabIndex={-1}
        >
          {MUTUALS.map((pool) => (
            <PoolCard key={pool.name} pool={pool} />
          ))}
        </div>
      </Settle>
    </SectionBand>
  );
}
