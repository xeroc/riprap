import { CheckIcon, CopyIcon } from "lucide-react";
import type * as React from "react";
import { useState } from "react";

import { cn } from "../../lib/utils";

/**
 * `CopyBlock` — a labeled, copyable block: a mono stamp naming what gets
 * copied ("blurb — one line"), the content as children (a chat bubble, an
 * email frame, plain text), and a copy button in the header row. The label
 * tells an introducer what just landed on the clipboard.
 *
 * Copy interaction is the AddressChip settle — icon + word swap, color-only
 * transition, so `prefers-reduced-motion` sees the final state.
 *
 * Data law: `value` is copied verbatim; this component never edits,
 * summarizes, or invents content.
 */
export interface CopyBlockProps extends React.ComponentProps<"article"> {
  /** mono label naming what is copied, e.g. "blurb — one line" */
  label: string;
  /** the exact string placed on the clipboard */
  value: string;
  /** optional mono hint under the label, e.g. "paste into a chat" */
  hint?: string;
}

export function CopyBlock({ label, value, hint, className, children, ...props }: CopyBlockProps) {
  const [copied, setCopied] = useState(false);

  const handleCopy: React.MouseEventHandler<HTMLButtonElement> = () => {
    navigator.clipboard
      ?.writeText(value)
      .then(() => {
        setCopied(true);
        window.setTimeout(() => setCopied(false), 2000);
      })
      .catch((error: unknown) => console.error("copy-block copy failed", error));
  };

  return (
    <article
      data-slot="copy-block"
      className={cn("flex w-full flex-col border border-hairline bg-card", className)}
      {...props}
    >
      <div className="flex items-center justify-between gap-4 border-b border-hairline px-4 py-3">
        <div className="flex min-w-0 flex-col gap-1">
          <span className="truncate uppercase tracking-(--riprap-tracking-stamp) text-muted-foreground [font:var(--riprap-mono-label)]">
            {label}
          </span>
          {hint ? (
            <span className="truncate text-muted-soft [font:var(--riprap-mono-label)]">{hint}</span>
          ) : null}
        </div>
        <button
          type="button"
          data-slot="copy-block-button"
          aria-label={copied ? `${label} copied` : `copy ${label}`}
          onClick={handleCopy}
          className={cn(
            "inline-flex min-h-11 shrink-0 items-center gap-2 rounded-none border border-hairline-strong bg-transparent px-3",
            "text-body [font:var(--riprap-mono-label)] tracking-(--riprap-tracking-stamp)",
            "transition-[border-color,color] duration-[160ms] ease-out outline-none",
            "hover:border-stone hover:text-ink focus-visible:ring-3 focus-visible:ring-ring",
          )}
        >
          {copied ? (
            <span className="inline-flex items-center gap-1.5 text-stone">
              <CheckIcon className="size-3.5" />
              copied
            </span>
          ) : (
            <span className="inline-flex items-center gap-1.5">
              <CopyIcon className="size-3.5 text-muted-foreground" />
              copy
            </span>
          )}
        </button>
      </div>
      <div data-slot="copy-block-body" className="p-4">
        {children}
      </div>
    </article>
  );
}
