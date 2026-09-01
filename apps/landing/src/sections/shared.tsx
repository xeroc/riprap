import type { ReactNode } from "react";

/** The one live external account (messaging guide: handles are facts). */
export const X_URL = "https://x.com/riprapxyz";

export function XLink() {
  return (
    <a href={X_URL} target="_blank" rel="noopener noreferrer">
      @riprapxyz on X
    </a>
  );
}

/**
 * Unresolved parameter — visible monospace chip, never a fake endpoint.
 * Framing per the copy doc's Page Notes: parameters are published with the
 * pool terms, before anyone pays anything.
 */
export function ParamChip({ name }: { name: string }) {
  return <code className="param-chip">{name}</code>;
}

/** Kit visual + deadpan caption. */
export function Viz({ caption, children }: { caption?: string; children: ReactNode }) {
  return (
    <figure className="viz" aria-hidden={caption ? undefined : true}>
      {children}
      {caption ? <figcaption>{caption}</figcaption> : null}
    </figure>
  );
}
