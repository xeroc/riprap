// §1.2 — MUTUALS: the directory band right below the hero (copy doc §1.2).
// A drifting carousel of cards that scrolls itself horizontally and pauses
// on hover, focus, drag, and reduced motion; no visible scrollbar. Every
// card is one clickable link to the pool's detail route (`#/m/<id>`) —
// stretched-link pattern: the link overlays the whole card (cursor: pointer
// everywhere), the supporter discs sit above it with their own links. Cards
// carry each pool's real tier numbers (docs §5) and deterministic demo
// stats (placeholder, NOT FOR DEPLOY). Bounties render dashed with a BOUNTY
// stamp; mutuals hairline. "Show all" routes to #/mutuals.
//
// The drift is a time-based rAF marquee over a duplicated card rail: past
// the halfway point it wraps by exactly one set — seamlessly. It only runs
// while the band is in view, not hovered/focused/dragged, and motion is
// allowed; otherwise the track is an ordinary scrollable row.

import { Button, SectionBand } from "@riprap/ui";
import { useInView, useReducedMotion } from "motion/react";
import { useEffect, useRef, useState } from "react";

import { Settle } from "../components/Settle";
import {
  capRange,
  demoStats,
  entryRange,
  MUTUALS,
  payoutWord,
  poolRoute,
  supportersFor,
} from "../mutuals/data";
import type { MutualListing } from "../mutuals/types";

const DRIFT_PX_PER_S = 42; // gentle — a slow walk, not a slide

function CardDiscs({ pool }: { pool: MutualListing }) {
  const list = supportersFor(pool);
  if (list.length === 0) return null;
  return (
    <div className="relative z-10 flex items-center -space-x-2">
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

// Breakpoint's own lockup, black on the event pink (founder ask) — half
// the size of the event site's nav lockup, floating above the card's top
// edge; inert to the pointer so the card stays one link.
function EventBadge() {
  return (
    <span
      role="img"
      aria-label="Breakpoint 2026"
      className="pointer-events-none absolute -top-3 left-4 z-10 flex h-[18px] items-center gap-[3.57px] bg-(--bp-2026-pink) px-2 text-black"
    >
      <img
        src="/breakpoint-assets/nav-solana.svg"
        alt=""
        aria-hidden="true"
        className="block h-[9.78px] w-[11.34px]"
      />
      <img
        src="/breakpoint-assets/nav-bp26.svg"
        alt=""
        aria-hidden="true"
        className="block h-[10px] w-[52.23px]"
      />
    </span>
  );
}

function PoolCard({ pool }: { pool: MutualListing }) {
  const stats = demoStats(pool);
  const bounty = pool.kind === "bounty";
  return (
    // the whole card is the pool's detail link (stretched over the card);
    // the class distinction: mutuals hairline, bounties dashed
    <article
      data-kind={pool.kind}
      className={`relative flex w-72 shrink-0 flex-col gap-4 border p-5 sm:w-80 ${
        bounty ? "border-dashed border-hairline-strong" : "border-hairline"
      } bg-surface-card`}
    >
      <EventBadge />
      <a
        href={poolRoute(pool)}
        className="absolute inset-0 z-0 cursor-pointer focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
      >
        <span className="sr-only">{pool.name} — details</span>
      </a>
      <div className="flex flex-col gap-2">
        <div className="flex items-baseline justify-between gap-3">
          <h3 className="tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-sm)]">
            {pool.name}
          </h3>
          {pool.badge ? (
            <p className="shrink-0 border border-accent px-1.5 py-0.5 uppercase tracking-(--riprap-tracking-stamp) text-accent [font:var(--riprap-mono-label)]">
              {pool.badge}
            </p>
          ) : null}
        </div>
        <p
          data-slot="kind"
          className="uppercase tracking-(--riprap-tracking-stamp) text-muted-soft [font:var(--riprap-mono-label)]"
        >
          {bounty ? "bounty" : "pool"}
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
          <dt className="text-muted-foreground">{payoutWord(pool)}</dt>
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
          <dt className="text-muted-foreground">{bounty ? "pot" : "pool"}</dt>
          <dd data-num className="text-ink">
            ${stats.pool.toLocaleString("en-US")}
          </dd>
        </div>
      </dl>
      <div className="mt-auto flex items-center justify-between gap-3 pt-1">
        <CardDiscs pool={pool} />
      </div>
    </article>
  );
}

export function Mutuals() {
  const trackRef = useRef<HTMLDivElement>(null);
  const reduce = useReducedMotion();
  const inView = useInView(trackRef); // live — drift runs only while visible
  const [hovered, setHovered] = useState(false);

  // pause causes, read by the rAF loop through a ref (no re-render churn)
  const pausedRef = useRef({ hovered: false, focused: false, dragging: false });
  pausedRef.current.hovered = hovered;

  useEffect(() => {
    if (reduce) return; // reduced motion: an ordinary scrollable row
    const track = trackRef.current;
    if (!track) return;
    let raf = 0;
    let last = performance.now();
    const step = (now: number) => {
      raf = requestAnimationFrame(step);
      const delta = Math.min((now - last) / 1000, 0.1);
      last = now;
      const { hovered: h, focused: f, dragging: d } = pausedRef.current;
      if (h || f || d) return;
      track.scrollLeft += DRIFT_PX_PER_S * delta;
      // the rail is the card list twice — wrap by exactly one set, seamlessly
      const half = track.scrollWidth / 2;
      if (track.scrollLeft >= half) track.scrollLeft -= half;
    };
    raf = requestAnimationFrame(step);
    return () => cancelAnimationFrame(raf);
  }, [reduce]);

  useEffect(() => {
    const track = trackRef.current;
    if (!track) return;
    const onFocusIn = () => (pausedRef.current.focused = true);
    const onFocusOut = () => (pausedRef.current.focused = false);
    const onPointerDown = () => (pausedRef.current.dragging = true);
    const onPointerUp = () => (pausedRef.current.dragging = false);
    track.addEventListener("focusin", onFocusIn);
    track.addEventListener("focusout", onFocusOut);
    track.addEventListener("pointerdown", onPointerDown);
    window.addEventListener("pointerup", onPointerUp);
    return () => {
      track.removeEventListener("focusin", onFocusIn);
      track.removeEventListener("focusout", onFocusOut);
      track.removeEventListener("pointerdown", onPointerDown);
      window.removeEventListener("pointerup", onPointerUp);
    };
  }, []);

  const driftOn = !reduce && inView;
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
          <Button asChild size="sm">
            <a href="#/mutuals">Show all</a>
          </Button>
        </div>

        <div
          ref={trackRef}
          data-autoplay={driftOn ? "on" : "off"}
          data-paused={hovered ? "true" : "false"}
          onPointerEnter={() => setHovered(true)}
          className="no-scrollbar carousel-edge-fade flex w-full gap-4 overflow-x-auto pt-3 pb-2"
          tabIndex={-1}
        >
          {MUTUALS.map((pool) => (
            <div key={pool.name}>
              <PoolCard pool={pool} />
            </div>
          ))}
          {MUTUALS.map((pool) => (
            <div key={`${pool.name}-clone`} aria-hidden="true">
              <PoolCard pool={pool} />
            </div>
          ))}
        </div>
      </Settle>
    </SectionBand>
  );
}
