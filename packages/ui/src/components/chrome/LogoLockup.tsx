import { Logomark } from "./Logomark";
import { Wordmark } from "./Wordmark";

/**
 * Horizontal lockup: the ring + the wordmark, mark height matching the
 * wordmark's cap-height band. This is the TopNav / footer composition.
 */
export interface LogoLockupProps {
  /** wordmark font size in px. Default 28. */
  size?: number;
  /** hide the wordmark (mark-only lockup, e.g. avatar surfaces) */
  wordmark?: boolean;
  markState?: "settled" | "assemble" | "dissolve";
}

export function LogoLockup({ size = 28, wordmark = true, markState = "settled" }: LogoLockupProps) {
  return (
    <span
      style={{ display: "inline-flex", alignItems: "center", gap: "var(--riprap-space-sm)" }}
      role="img"
      aria-label="riprap"
    >
      <Logomark size={Math.round(size * 1.35)} state={markState} />
      {wordmark ? <Wordmark size={size} /> : null}
    </span>
  );
}
