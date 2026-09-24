// §5.6 — SUPPORTERS: the front page's avatar stack (copy doc §5.6). One disc
// per post that mentions @riprapxyz, each disc linking the post itself. Data
// lives in supporters.json, written by the mention-watcher script (bean
// riprap-9spw — not built yet): [{ handle, url, avatar? }]. Renders nothing
// while the list is empty — no invented names, no placeholder discs (kit data
// law). Discs are avatar discs, the one sanctioned circle (DESIGN.md §
// Shapes); a supporter without a profile image gets the mono initials disc.

import { SectionBand } from "@riprap/ui";

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

/** The disc row itself: one disc per post, linked to the post. Shared by the
 * front-page band (§5.6) and the pool page hero (§ pool page, 2026-09-24). */
export function SupporterDiscs({ list = SUPPORTERS }: { list?: Supporter[] }) {
  return (
    <div className="flex items-center -space-x-3">
      {list.map((supporter) => (
        <a
          key={supporter.url}
          href={supporter.url}
          target="_blank"
          rel="noopener noreferrer"
          title={`@${supporter.handle}`}
          aria-label={`@${supporter.handle} — their post`}
          className="relative z-0 inline-block rounded-full transition-[z-index] hover:z-10 focus-visible:z-10 focus-visible:outline-none focus-visible:ring-3 focus-visible:ring-ring"
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
          Every post that mentions @riprapxyz lands a disc here, linked to the post.
        </p>
        <SupporterDiscs list={list} />
      </Settle>
    </SectionBand>
  );
}
