import type * as React from "react";

import { cn } from "../../lib/utils";

/**
 * `EmailCard` — a compose frame: mono field labels (to / subject) with
 * their values, a hairline rule, then the body verbatim. For blurb
 * surfaces: the pre-written forwardable intro email.
 *
 * Data law: to/subject/body arrive as props, verbatim — this component
 * never edits, summarizes, or invents content. No fetches here.
 */
export interface EmailCardProps {
  /** the To: line, verbatim (may be a placeholder like "[investor name]") */
  to: string;
  /** the Subject: line, verbatim */
  subject: string;
  /** the email body, verbatim; \n preserved */
  children: React.ReactNode;
  /** width is the consumer's call, e.g. "max-w-xl" */
  className?: string;
}

function Field({ label, value }: { label: string; value: string }) {
  return (
    <div className="flex items-baseline gap-3">
      <span className="w-14 shrink-0 text-right uppercase tracking-(--riprap-tracking-stamp) text-muted-soft [font:var(--riprap-mono-label)]">
        {label}
      </span>
      <span className="min-w-0 flex-1 truncate text-ink [font:var(--riprap-body-sm)]">{value}</span>
    </div>
  );
}

export function EmailCard({ to, subject, children, className }: EmailCardProps) {
  return (
    <article
      data-slot="email-card"
      className={cn("flex w-full flex-col gap-3 bg-card p-4", className)}
    >
      <Field label="to" value={to} />
      <Field label="subject" value={subject} />
      <div data-slot="email-card-body" className="border-t border-hairline pt-3">
        <div className="text-left whitespace-pre-line text-body [font:var(--riprap-body-sm)]">
          {children}
        </div>
      </div>
    </article>
  );
}
