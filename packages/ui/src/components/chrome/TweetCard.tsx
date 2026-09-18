import type * as React from "react";
import { cn } from "../../lib/utils";

/** The X glyph — currentColor; sized/colored by its parent. */
export function XLogo({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden="true"
      width="1em"
      height="1em"
    >
      <path d="M18.244 2.25h3.308l-7.227 8.26 8.502 11.24H16.17l-4.714-6.231-5.401 6.231H2.742l7.727-8.826L1.667 2.25H8.32l4.259 5.637L18.244 2.25zM17.083 19.77h1.833L7.084 4.126H5.117L17.083 19.77z" />
    </svg>
  );
}

/** first letters of the first two words — the no-avatar fallback tile */
function initials(author: string): string {
  const parts = author.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/**
 * `TweetCard` — a quoted tweet rendered as the real thing: paper card
 * (`data-mode="paper"` flips every token to the light inversion, so the
 * quote reads like an x.com light-mode post pinned onto the dark board),
 * the author's real avatar as the one sanctioned circle (DESIGN.md §
 * Shapes — the avatar disc), grotesk quote body, mono handle and date.
 * Ported from the Tributary wall (MIT, berkayoztunc/orquestra).
 *
 * Data law: author/handle/text/date arrive as props, verbatim quotes —
 * this component never edits, summarizes, or invents content. Long quotes
 * truncate at `maxChars` with an ellipsis. `avatar` is a URL/path prop;
 * without it the card falls back to the initials tile. No fetches here.
 */
export interface TweetCardProps {
  /** display name, e.g. "bunjil" */
  author: string;
  /** screen name without @, e.g. "bunjil" */
  handle: string;
  /** the quote, verbatim; \n preserved */
  text: string;
  /** formatted date stamp, e.g. "Dec 12, 2025" */
  date: string;
  /** avatar image URL/path; omit for the initials tile */
  avatar?: string;
  /** quote-length limit before ellipsis (default 140) */
  maxChars?: number;
  /** when given the card renders as a link to the tweet */
  href?: string;
  /** width is the consumer's call, e.g. "w-80" */
  className?: string;
}

export function TweetCard({
  author,
  handle,
  text,
  date,
  avatar,
  maxChars = 140,
  href,
  className,
}: TweetCardProps) {
  const clipped = text.length > maxChars ? `${text.slice(0, maxChars).trimEnd()}…` : text;
  const shell = cn(
    "flex w-fit flex-col gap-3 rounded-none border border-hairline bg-card p-4",
    className,
  );
  const body = (
    <>
      <div className="flex w-full items-center gap-3">
        {avatar ? (
          <img
            src={avatar}
            alt={`avatar of ${author}`}
            width={40}
            height={40}
            className="h-10 w-10 shrink-0 rounded-full border border-hairline-strong object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-10 w-10 shrink-0 items-center justify-center rounded-none border border-hairline bg-surface-strong text-muted-foreground [font:var(--riprap-mono-label)]"
          >
            {initials(author)}
          </span>
        )}
        <span className="min-w-0 flex-1 text-left">
          <span className="block truncate text-ink [font:var(--riprap-title-sm)]">{author}</span>
          <span className="block truncate text-muted-foreground [font:var(--riprap-mono-label)]">
            @{handle}
          </span>
        </span>
        <XLogo className="ml-1 shrink-0 text-2xl text-muted-foreground" />
      </div>
      <p className="m-0 w-full whitespace-pre-line text-left text-body [font:var(--riprap-body-sm)]">
        {clipped}
      </p>
      <p className="m-0 w-full text-left uppercase tracking-(--riprap-tracking-stamp) text-muted-foreground [font:var(--riprap-mono-label)]">
        {date}
      </p>
    </>
  );
  const dataMode = { "data-mode": "paper" } as React.HTMLAttributes<HTMLElement>;
  return href ? (
    <a
      {...dataMode}
      data-slot="tweet-card"
      href={href}
      target="_blank"
      rel="noopener noreferrer"
      className={shell}
    >
      {body}
    </a>
  ) : (
    <article {...dataMode} data-slot="tweet-card" className={shell}>
      {body}
    </article>
  );
}
