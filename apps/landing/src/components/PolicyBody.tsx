// PolicyBody — a free-form policy body rendered as markdown (react-markdown
// + GFM). The body is author-controlled, so raw HTML is skipped and every
// link/image URL passes the scheme allowlist; there is no rehype-raw. Every
// numeral run goes through Prose (DESIGN.md § Typography). Headings map
// below h2: the page already owns the band's h2.
import { numeralSegments } from "@riprap/ui";
import { Fragment, type ReactNode } from "react";
import ReactMarkdown from "react-markdown";
import remarkGfm from "remark-gfm";

const ALLOWED_PROTOCOLS = new Set(["http:", "https:", "mailto:"]);

/** Allow relative/anchor links and http(s)/mailto; everything else becomes
 *  text (the anchor/image render drops the empty URL). */
export function safePolicyUrl(url: string): string {
  if (url.startsWith("#") || url.startsWith("/") || !/^[a-z][a-z0-9+.-]*:/i.test(url)) {
    return url;
  }
  try {
    return ALLOWED_PROTOCOLS.has(new URL(url).protocol) ? url : "";
  } catch {
    return "";
  }
}

function mono(children: ReactNode): ReactNode {
  if (typeof children === "string") {
    return (
      <>
        {numeralSegments(children).map((segment, index) =>
          segment.numeral ? (
            <span key={index} data-num className="font-mono">
              {segment.text}
            </span>
          ) : (
            <span key={index}>{segment.text}</span>
          ),
        )}
      </>
    );
  }
  if (typeof children === "number") return mono(String(children));
  if (Array.isArray(children)) {
    return children.map((child, index) => <Fragment key={index}>{mono(child)}</Fragment>);
  }
  return children;
}

function InlineCode({ className, children }: { className?: string; children?: ReactNode }) {
  const block = className?.startsWith("language-") || String(children).includes("\n");
  return block ? (
    <code className="font-mono text-xs">{children}</code>
  ) : (
    <code className="bg-surface px-1 py-0.5 font-mono text-[0.92em] text-ink">{children}</code>
  );
}

export function PolicyBody({ markdown }: { markdown: string }) {
  return (
    <div
      data-slot="policy-body"
      className="flex max-w-3xl flex-col gap-3 leading-relaxed text-body [font:var(--riprap-body-md)]"
    >
      <ReactMarkdown
        remarkPlugins={[remarkGfm]}
        skipHtml
        urlTransform={safePolicyUrl}
        components={{
          h1: ({ children }) => (
            <h3 className="text-ink [font:var(--riprap-display-sm)]">{mono(children)}</h3>
          ),
          h2: ({ children }) => (
            <h3 className="text-ink [font:var(--riprap-display-sm)]">{mono(children)}</h3>
          ),
          h3: ({ children }) => (
            <h4 className="text-ink [font:var(--riprap-body-md)]">{mono(children)}</h4>
          ),
          h4: ({ children }) => (
            <h5 className="text-ink [font:var(--riprap-body-sm)]">{mono(children)}</h5>
          ),
          h5: ({ children }) => (
            <h6 className="text-ink [font:var(--riprap-body-sm)]">{mono(children)}</h6>
          ),
          h6: ({ children }) => (
            <h6 className="text-muted-foreground [font:var(--riprap-body-sm)]">{mono(children)}</h6>
          ),
          p: ({ children }) => (
            <p className="leading-relaxed text-body [font:var(--riprap-body-md)]">
              {mono(children)}
            </p>
          ),
          ul: ({ children }) => (
            <ul className="flex list-disc flex-col gap-2 pl-6 text-body">{children}</ul>
          ),
          ol: ({ children }) => (
            <ol className="flex list-decimal flex-col gap-2 pl-6 text-body">{children}</ol>
          ),
          li: ({ children }) => (
            <li className="leading-relaxed [font:var(--riprap-body-sm)]">{mono(children)}</li>
          ),
          blockquote: ({ children }) => (
            <blockquote className="border-l-2 border-accent pl-4 text-muted-foreground">
              {children}
            </blockquote>
          ),
          a: ({ href, title, children }) =>
            href ? (
              <a
                href={href}
                title={title}
                rel="nofollow noopener noreferrer"
                target={href.startsWith("#") ? undefined : "_blank"}
                className="text-accent underline decoration-hairline underline-offset-2 hover:decoration-accent"
              >
                {mono(children)}
              </a>
            ) : (
              <span>{mono(children)}</span>
            ),
          strong: ({ children }) => (
            <strong className="font-semibold text-ink">{mono(children)}</strong>
          ),
          em: ({ children }) => <em>{mono(children)}</em>,
          del: ({ children }) => <del>{mono(children)}</del>,
          code: InlineCode,
          pre: ({ children }) => (
            <pre className="overflow-x-auto border border-hairline bg-surface p-3 text-xs leading-relaxed">
              {children}
            </pre>
          ),
          table: ({ children }) => (
            <div className="overflow-x-auto">
              <table className="w-full border-collapse text-sm">{children}</table>
            </div>
          ),
          th: ({ children }) => (
            <th className="border-b border-hairline px-2 py-2 text-left align-top font-mono text-xs text-muted-foreground">
              {mono(children)}
            </th>
          ),
          td: ({ children }) => (
            <td className="border-b border-hairline px-2 py-2 align-top text-body [font:var(--riprap-body-sm)]">
              {mono(children)}
            </td>
          ),
          hr: () => <hr className="border-hairline" />,
          img: ({ src, alt }) =>
            src ? (
              <img
                src={src}
                alt={alt ?? ""}
                loading="lazy"
                referrerPolicy="no-referrer"
                className="max-w-full border border-hairline"
              />
            ) : null,
        }}
      >
        {markdown}
      </ReactMarkdown>
    </div>
  );
}
