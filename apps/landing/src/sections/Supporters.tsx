// §5.6 — SUPPORTERS: the front page's avatar stack (copy doc §5.6). One disc
// per person who mentions @riprapxyz (newest post wins — the watcher's merge
// law), linked to that post. Data lives in supporters.json, written by the
// mention watcher `scripts/supporters.mts` (bean riprap-9spw): [{ handle,
// url, avatar? }]. Renders nothing while the list is empty — no invented
// names, no placeholder discs (kit data law). Discs are avatar discs, the one
// sanctioned circle (DESIGN.md § Shapes); a supporter without a profile image
// gets the mono initials disc. Above MAX_SHOWN people the row keeps 16 discs
// and slowly rotates the rest in: one random disc fades out (settle), a
// hidden one takes its slot and fades in.

import { SectionBand } from "@riprap/ui";
import { useEffect, useRef, useState } from "react";

import { Settle } from "../components/Settle";
import supporters from "../supporters.json";

export type Supporter = {
  /** screen name without @, e.g. "riprapxyz" */
  handle: string;
  /** the post that earned the disc */
  url: string;
  /** profile image URL; omit for the initials disc */
  avatar?: string;
};

/** The committed mention list — the only writer is the mention watcher
 * (bean riprap-9spw). Shared by the the front-page band and the pool page hero. */
export const SUPPORTERS = supporters as Supporter[];

/** The disc row: one disc per person, linked to their newest post. Shared by
 * the front-page band (§5.6) and the pool page hero. Above MAX_SHOWN the row
 * shows 16 and rotates: every SWAP_EVERY_MS one random disc fades out and a
 * not-yet-shown one fades into its slot (settle fades; motion-reduce swaps
 * instantly). */
const MAX_SHOWN = 16;
const SWAP_EVERY_MS = 4000;
const FADE_MS = 160; // --riprap-settle — settle, not slide

export function SupporterDiscs({ list = SUPPORTERS }: { list?: Supporter[] }) {
  const [row, setRow] = useState<Supporter[]>(() => list.slice(0, MAX_SHOWN));
  // the slot currently mid-swap — opacity-0 during fade-out AND while the
  // replacement mounts, so the new disc fades in from invisible
  const [swapping, setSwapping] = useState<number | null>(null);
  const rowRef = useRef(row);
  rowRef.current = row;

  // a fresh list (new supporters.json) resets the row
  useEffect(() => {
    setRow(list.slice(0, MAX_SHOWN));
    setSwapping(null);
  }, [list]);

  useEffect(() => {
    if (list.length <= MAX_SHOWN) return; // no overflow, no rotation
    let fadeTimer = 0;
    let enterTimer = 0;
    const interval = window.setInterval(() => {
      const current = rowRef.current;
      const out = Math.floor(Math.random() * current.length);
      const shownUrls = new Set(current.map((s) => s.url));
      const hidden = list.filter((s) => !shownUrls.has(s.url));
      const inc = hidden[Math.floor(Math.random() * hidden.length)];
      if (!inc) return;
      setSwapping(out); // the outgoing disc settles to invisible
      fadeTimer = window.setTimeout(() => {
        setRow(current.map((s, i) => (i === out ? inc : s)));
        enterTimer = window.setTimeout(() => setSwapping(null), 40); // fade in
      }, FADE_MS + 40);
    }, SWAP_EVERY_MS);
    return () => {
      window.clearInterval(interval);
      window.clearTimeout(fadeTimer);
      window.clearTimeout(enterTimer);
    };
  }, [list]);

  return (
    <div className="flex items-center -space-x-3">
      {row.map((supporter, index) => (
        <a
          key={supporter.url}
          href={supporter.url}
          target="_blank"
          rel="noopener noreferrer"
          title={`@${supporter.handle}`}
          aria-label={`@${supporter.handle} — their post`}
          className={[
            "relative z-0 inline-block rounded-full transition-opacity duration-[160ms] ease-out motion-reduce:transition-none hover:z-10 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring",
            swapping === index ? "opacity-0" : "opacity-100",
          ].join(" ")}
        >
          {supporter.avatar ? (
            <img
              src={supporter.avatar}
              alt={`@${supporter.handle}`}
              width={48}
              height={48}
              loading="lazy"
              className="h-12 w-12 rounded-full border border-hairline-strong bg-surface-card object-cover object-center"
            />
          ) : (
            <span className="flex h-12 w-12 items-center justify-center rounded-full border border-hairline-strong bg-surface-card font-mono text-sm text-muted-foreground">
              {supporter.handle.replace(/^@/, "").slice(0, 2).toUpperCase()}
            </span>
          )}
        </a>
      ))}
    </div>
  );
}

export function Supporters({ list = SUPPORTERS }: { list?: Supporter[] }) {
  if (list.length === 0) return null;
  return (
    <SectionBand id="supporters" label="supporters" tone="ground">
      <Settle className="flex max-w-2xl flex-col gap-4">
        <p className="leading-relaxed text-body [font:var(--riprap-body-md)]">
          Everyone who mentions @riprapxyz lands a disc here, linked to their post.
        </p>
        <SupporterDiscs list={list} />
      </Settle>
    </SectionBand>
  );
}
