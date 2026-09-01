/**
 * The Riprap wordmark — "riprap", lowercase, Space Grotesk 700, tracked to the
 * kiss (-0.04em). Set as live text (crisp at every size, selectable, no asset
 * drift); DESIGN.md § Typography is the law. The mark never re-typesets into
 * other words or cases.
 */
export interface WordmarkProps {
  /** font size in px. Default 28. */
  size?: number;
  className?: string;
}

export function Wordmark({ size = 28, className }: WordmarkProps) {
  return (
    <span
      className={className}
      style={{
        fontFamily: "var(--riprap-font-prose)",
        fontWeight: 700,
        fontSize: size,
        lineHeight: 1,
        letterSpacing: "-0.04em",
        color: "var(--riprap-ink)",
      }}
    >
      riprap
    </span>
  );
}
