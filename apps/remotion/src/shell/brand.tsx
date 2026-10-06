import { Wordmark } from "@riprap/ui";
import { Easing, interpolate, useCurrentFrame } from "remotion";

import { RingMark } from "./ring";

/**
 * The brand beats every Riprap video opens and closes with (founder
 * directive 2026-10-05: default for all future videos; the headline/line
 * are per-video props). Motion: brand-ink-open / settle-lockup grammar
 * (video-shotcraft cards), curve-faithful, deterministic.
 */

const LETTER_EASE = Easing.bezier(0.3, 0, 0.2, 1);
const WORDMARK = "riprap";

// ── the open ────────────────────────────────────────────────────────────

/** all entrances complete by ~f42; the lockup then holds ≥1s (R1 law) */
export const BRAND_OPEN_DURATION = 75;
export const BRAND_OPEN_HOLD_FROM = 45;

/** default kicker — landing-page.md §1 head title */
export const DEFAULT_KICKER = "MUTUALS ON SOLANA";
/** default headline — landing-page.md §1 H1 ("Your group's got you covered.") */
export const DEFAULT_HEADLINE = "Your group's got you covered.";

const KICK_START = 26;
const PER_CHAR = 0.7; // decorative small text only (card law)

export function BrandOpen({
  kicker = DEFAULT_KICKER,
  headline = DEFAULT_HEADLINE,
}: {
  kicker?: string;
  headline?: string;
}) {
  const frame = useCurrentFrame();

  // crosshair: vertical 0→7, horizontal 6→14, fades 18→26
  const vDraw = interpolate(frame, [0, 7], [100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: LETTER_EASE,
  });
  const hDraw = interpolate(frame, [6, 14], [100, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.linear,
  });
  const crossFade = interpolate(frame, [18, 26], [1, 0], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
  });

  // kicker typewriter + cursor (2f blink, stops at 70)
  const kickChars = Math.floor(Math.max(0, frame - KICK_START) / PER_CHAR);
  const cursorOn = frame < 70 ? Math.floor(frame / 2) % 2 === 0 : false;

  const h1T = interpolate(frame, [30, 42], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: LETTER_EASE,
  });

  return (
    <div className="absolute inset-0" style={{ background: "var(--riprap-canvas)" }}>
      {/* ink crosshair — drawn then gone (never fights the wordmark) */}
      {crossFade > 0.01 ? (
        <svg
          className="absolute inset-0"
          aria-hidden="true"
          width="1920"
          height="1080"
          viewBox="0 0 1920 1080"
          style={{ opacity: crossFade }}
        >
          <line
            x1="960"
            y1="440"
            x2="960"
            y2="640"
            stroke="var(--riprap-stone)"
            strokeWidth="2"
            pathLength={100}
            strokeDasharray="100"
            strokeDashoffset={vDraw}
          />
          <line
            x1="860"
            y1="540"
            x2="1060"
            y2="540"
            stroke="var(--riprap-stone)"
            strokeWidth="2"
            pathLength={100}
            strokeDasharray="100"
            strokeDashoffset={hDraw}
          />
        </svg>
      ) : null}

      <div
        className="absolute inset-0 flex flex-col items-center justify-center"
        style={{ gap: 56 }}
      >
        <p
          className="m-0"
          style={{
            fontFamily: "var(--riprap-font-mono)",
            fontSize: 24,
            textTransform: "uppercase",
            letterSpacing: "var(--riprap-tracking-stamp)",
            color: "var(--riprap-muted)",
            minHeight: 30,
          }}
        >
          {kicker.slice(0, kickChars)}
          {frame < 70 ? (
            <span
              style={{
                display: "inline-block",
                width: 13,
                height: 26,
                marginLeft: 6,
                verticalAlign: "-4px",
                background: "var(--riprap-accent)",
                opacity: cursorOn ? 1 : 0,
              }}
            />
          ) : null}
        </p>

        <div className="flex items-center" style={{ gap: 64 }}>
          <RingMark frame={frame} size={200} mode="assemble" />
          <div style={{ display: "flex", alignItems: "baseline" }}>
            {WORDMARK.split("").map((ch, i) => {
              const delay = 8 + i * 3; // stagger rides the index — keys must too

              const t = interpolate(frame, [delay, delay + 12], [0, 1], {
                extrapolateLeft: "clamp",
                extrapolateRight: "clamp",
                easing: LETTER_EASE,
              });
              return (
                <span
                  key={`wm-${ch}-${delay}`}
                  style={{
                    fontFamily: "var(--riprap-font-prose)",
                    fontWeight: 700,
                    fontSize: 150,
                    letterSpacing: "var(--riprap-tracking-mega)",
                    color: "var(--riprap-ink)",
                    display: "inline-block",
                    transformOrigin: "center bottom",
                    transform: `scale(${1.6 - 0.6 * t})`,
                    filter: `blur(${(1 - t) * 6}px)`,
                    opacity: t,
                  }}
                >
                  {ch}
                </span>
              );
            })}
          </div>
        </div>

        {headline ? (
          <h1
            className="m-0"
            style={{
              fontFamily: "var(--riprap-font-prose)",
              fontWeight: 700,
              fontSize: 64,
              lineHeight: 1.05,
              letterSpacing: "var(--riprap-tracking-display)",
              color: "var(--riprap-ink)",
              opacity: h1T,
              transform: `translateY(${(1 - h1T) * 12}px)`,
            }}
          >
            {headline}
          </h1>
        ) : null}
      </div>
    </div>
  );
}

// ── the close ───────────────────────────────────────────────────────────

/** settle 8f, then a true-still hold ≥1s (R1 law) */
export const BRAND_CLOSE_DURATION = 45;
export const BRAND_CLOSE_HOLD_FROM = 15;

/**
 * default closing line — founder directive 2026-10-05: "Mutuals as an open
 * protocol" (the platform thesis, PROJECT.md §the-claim: "mutuals as an
 * open protocol: permissionless creation, one risk per pool, members
 * adjudicate"). Replaces "Protection without a protector." (§4 closing) —
 * the old line narrows the protocol to protection stories.
 */
export const DEFAULT_CLOSE_LINE = "Mutuals as an open protocol.";

/** PROJECT.md open questions #2 — the registered primary domain */
export const CLOSE_LINK = "riprap.xyz";

export function BrandClose({ line = DEFAULT_CLOSE_LINE }: { line?: string }) {
  const frame = useCurrentFrame();

  const t = interpolate(frame, [0, 8], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.out(Easing.quad),
  });
  const lineT = interpolate(frame, [4, 14], [0, 1], {
    extrapolateLeft: "clamp",
    extrapolateRight: "clamp",
    easing: Easing.bezier(0.3, 0, 0.2, 1),
  });

  return (
    <div
      className="absolute inset-0"
      style={{
        background: "var(--riprap-canvas)",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        justifyContent: "center",
        gap: 48,
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 56,
          opacity: t,
          transform: `translateY(${(1 - t) * -12}px)`,
        }}
      >
        <RingMark frame={30} size={180} mode="settled" />
        <Wordmark size={150} />
      </div>
      <h2
        style={{
          margin: 0,
          fontFamily: "var(--riprap-font-prose)",
          fontWeight: 700,
          fontSize: 62,
          lineHeight: 1.15,
          letterSpacing: "var(--riprap-tracking-display)",
          color: "var(--riprap-ink)",
          opacity: lineT,
          transform: `translateY(${(1 - lineT) * 12}px)`,
        }}
      >
        {line}
      </h2>
      <p
        data-num
        style={{
          margin: 0,
          fontFamily: "var(--riprap-font-mono)",
          fontSize: 40,
          letterSpacing: "var(--riprap-tracking-stamp)",
          color: "var(--riprap-funds-ink)",
          opacity: lineT,
        }}
      >
        {CLOSE_LINK}
      </p>
    </div>
  );
}
