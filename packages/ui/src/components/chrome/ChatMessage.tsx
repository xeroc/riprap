import { cn } from "../../lib/utils";

/** first letters of the first two words — the no-avatar fallback tile */
function initials(author: string): string {
  const parts = author.trim().split(/\s+/).filter(Boolean);
  return ((parts[0]?.[0] ?? "") + (parts[1]?.[0] ?? "")).toUpperCase();
}

/**
 * `ChatMessage` — one chat message: sender row (avatar disc or initials
 * tile) and the message in a hairline bubble. For blurb surfaces: the
 * one-liner someone forwards into a group chat. Renders on the page's own
 * tones; TweetCard keeps the paper inversion for quoted tweets.
 *
 * Data law: author/text arrive as props, verbatim — this component never
 * edits, summarizes, or invents content. No fetches here.
 */
export interface ChatMessageProps {
  /** sender display name, e.g. "Fabian" */
  author: string;
  /** the message, verbatim; \n preserved */
  text: string;
  /** mono stamp under the bubble (channel/time note), e.g. "sent just now" */
  meta?: string;
  /** avatar image URL/path; omit for the initials tile */
  avatar?: string;
  /** width is the consumer's call, e.g. "w-80" */
  className?: string;
}

export function ChatMessage({ author, text, meta, avatar, className }: ChatMessageProps) {
  return (
    <article
      data-slot="chat-message"
      className={cn(
        "flex w-full max-w-[60ch] flex-col gap-3 border border-hairline bg-card p-4",
        className,
      )}
    >
      <div className="flex items-center gap-3">
        {avatar ? (
          <img
            src={avatar}
            alt={`avatar of ${author}`}
            width={32}
            height={32}
            className="h-8 w-8 shrink-0 rounded-full border border-hairline-strong object-cover"
          />
        ) : (
          <span
            aria-hidden="true"
            className="flex h-8 w-8 shrink-0 items-center justify-center rounded-none border border-hairline bg-surface-strong text-muted-foreground [font:var(--riprap-mono-label)]"
          >
            {initials(author)}
          </span>
        )}
        <span className="truncate text-ink [font:var(--riprap-title-sm)]">{author}</span>
      </div>
      <p className="m-0 w-full border border-hairline-strong bg-surface px-4 py-3 text-left whitespace-pre-line text-body [font:var(--riprap-body-sm)]">
        {text}
      </p>
      {meta ? (
        <p className="m-0 w-full text-left uppercase tracking-(--riprap-tracking-stamp) text-muted-foreground [font:var(--riprap-mono-label)]">
          {meta}
        </p>
      ) : null}
    </article>
  );
}
