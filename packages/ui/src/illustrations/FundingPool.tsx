import { motion, useReducedMotion } from "motion/react";
import { VESSEL, VesselLines } from "./Glyph";

/**
 * FundingPool — the join ceremony as one synchronized act.
 *
 * Brought in from an external demo, restyled to DESIGN.md: token colors
 * only (money = `funds` harbor-blue, the member = stone), the pool is the
 * kit's vessel (open-top U — every dollar is inside it or visibly leaving
 * it), stamps in mono, hairline depth, radius-12 panels, no shadows.
 *
 * Motion: a 6s wall-clock loop — the paper settles in, the signature
 * draws, the coin leaves the member and lands on the pool's surface, the
 * level rises, "you're in" stamps. Nothing reverts: every element holds
 * its end state to the cycle boundary, and the repeat is a hard cut back
 * to the fresh unsigned state (empty boxes, lower balance). The payout
 * boxes are NEVER checked — the signature alone carries the commitment.
 * Same user-sanctioned exception to the no-loops law as HexBackdrop's
 * breathers; position and opacity only. Under prefers-reduced-motion the
 * scene renders the completed join as one static frame.
 *
 * ponytail: no glyph-clock twin — wall-clock loop only; add a
 * deterministic twin (lib/settle.ts) if a video ever needs frame accuracy.
 */

// const LOOP = { duration: 6, repeat: Infinity, repeatDelay: 0 } as const;
const LOOP = { duration: 6, repeat: Infinity, repeatDelay: 30 } as const;

/** water levels as a fraction of the vessel interior (as authored) */
const LOW = 0.28 * VESSEL.fill.fullHeight;
const HIGH = 0.53 * VESSEL.fill.fullHeight;

/** the coin's flight: from the member's chest onto the pool's water
 * surface, inside the vessel (px, stage-local) */
const COIN = { left: 48, top: 276, dx: 18, dy: -126 };

export function FundingPool({ className }: { className?: string }) {
  const reduced = useReducedMotion();

  return (
    <div data-slot="funding-pool" className={className} style={{ width: 320 }}>
      {/* fixed 320×360 composition — absolute anchors (pool left, paper
          right) only hold against a constant stage width */}
      <div style={{ position: "relative", width: 320, height: 360 }}>
        {/* the pool — the kit's vessel; the level rises inside it */}
        <div style={{ position: "absolute", left: 8, top: 56, width: 140 }}>
          <div
            style={{
              font: "var(--riprap-mono-label)",
              fontSize: 10,
              letterSpacing: "var(--riprap-tracking-stamp)",
              textTransform: "uppercase",
              color: "var(--riprap-diagram-muted)",
              marginBottom: 6,
            }}
          ></div>
          <svg viewBox="22 26 52 48" width={140} data-slot="pool-vessel" aria-hidden="true">
            <VesselLines />
            <motion.rect
              data-slot="pool-water"
              x={VESSEL.fill.x}
              width={VESSEL.fill.width}
              fill="var(--riprap-funds)"
              initial={
                reduced
                  ? { height: HIGH, y: VESSEL.fill.floorY - HIGH }
                  : { height: LOW, y: VESSEL.fill.floorY - LOW }
              }
              animate={
                reduced
                  ? undefined
                  : {
                      height: [LOW, LOW, HIGH, HIGH],
                      y: [
                        VESSEL.fill.floorY - LOW,
                        VESSEL.fill.floorY - LOW,
                        VESSEL.fill.floorY - HIGH,
                        VESSEL.fill.floorY - HIGH,
                      ],
                    }
              }
              transition={{ ...LOOP, times: [0, 0.28, 0.55, 1], ease: "easeInOut" }}
            />
            <text
              x={48}
              y={38}
              textAnchor="middle"
              fill="var(--riprap-diagram-ink)"
              style={{ font: "700 5.5px var(--riprap-font-prose)" }}
            >
              Pool
            </text>
            <text
              x={48}
              y={44}
              textAnchor="middle"
              fill="var(--riprap-diagram-muted)"
              style={{ font: "400 4px var(--riprap-font-prose)" }}
            >
              Shared funding
            </text>
          </svg>
        </div>

        {/* the purpose agreement — settle in, get signed */}
        <motion.div
          data-slot="purpose-paper"
          style={{
            position: "absolute",
            right: 2,
            top: 12,
            width: 164,
            padding: 14,
            background: "var(--riprap-surface-card)",
            border: "1px solid var(--riprap-hairline-strong)",
            borderRadius: 12,
          }}
          initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          // fade in and STAY — explicit terminal keyframe at offset 1, or
          // WAAPI pads the tail back toward the base value 0 (fades out)
          animate={reduced ? undefined : { opacity: [0, 1, 1], y: [10, 0, 0] }}
          transition={{ ...LOOP, times: [0, 0.1, 1], ease: "easeOut" }}
        >
          <div
            style={{
              font: "var(--riprap-mono-label)",
              fontSize: 10,
              letterSpacing: "var(--riprap-tracking-stamp)",
              textTransform: "uppercase",
              color: "var(--riprap-diagram-muted)",
              marginBottom: 4,
            }}
          >
            Purpose agreement
          </div>
          <h3
            style={{
              margin: 0,
              fontFamily: "var(--riprap-font-prose)",
              fontWeight: 500,
              fontSize: 14,
              lineHeight: 1.35,
              color: "var(--riprap-diagram-ink)",
            }}
          >
            A shared commitment
          </h3>
          <div style={{ height: 1, background: "var(--riprap-hairline)", margin: "8px 0 12px" }} />

          <div style={{ marginBottom: 12 }}>
            <i
              style={{
                display: "block",
                height: 2,
                background: "var(--riprap-hairline-soft)",
                marginBottom: 10,
              }}
            />
            <i
              style={{
                display: "block",
                height: 2,
                background: "var(--riprap-hairline-soft)",
                marginBottom: 10,
              }}
            />
            <i style={{ display: "block", height: 2, background: "var(--riprap-hairline-soft)" }} />
          </div>

          <div
            style={{
              font: "var(--riprap-mono-label)",
              fontSize: 10,
              letterSpacing: "var(--riprap-tracking-stamp)",
              textTransform: "uppercase",
              color: "var(--riprap-diagram-muted)",
              marginBottom: 8,
            }}
          >
            Payouts
          </div>
          <Checkbox label="requirement A" />
          <Checkbox label="requirement B" />

          <div style={{ marginTop: 10 }}>
            <div
              style={{
                fontFamily: "var(--riprap-font-prose)",
                fontSize: 10,
                color: "var(--riprap-diagram-muted)",
                marginBottom: 2,
              }}
            >
              Your signature
            </div>
            <svg
              viewBox="0 0 180 48"
              width="100%"
              fill="none"
              data-slot="signature"
              aria-hidden="true"
            >
              <motion.path
                d="M8 31 C16 4 21 6 23 28 S34 34 43 18 C49 6 52 11 48 28 C46 38 60 25 66 20 S68 34 78 29 C88 24 89 11 94 18 S87 36 99 31 C109 27 114 18 121 20 S117 33 128 30 C139 27 148 13 153 16 S146 30 161 27 L173 25"
                stroke="var(--riprap-diagram-ink)"
                strokeWidth={2.2}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
                animate={reduced ? undefined : { pathLength: [0, 0, 1, 1] }}
                transition={{ ...LOOP, times: [0, 0.18, 0.39, 1], ease: "easeInOut" }}
              />
            </svg>
          </div>
        </motion.div>

        {/* the contribution — one coin, hand to vessel */}
        <motion.div
          data-slot="coin"
          style={{
            position: "absolute",
            left: COIN.left,
            top: COIN.top,
            width: 24,
            height: 24,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            background: "var(--riprap-funds)",
            border: "1.5px solid var(--riprap-funds-ink)",
            borderRadius: 6,
            font: "700 13px var(--riprap-font-mono)",
            color: "var(--riprap-on-primary)",
          }}
          initial={{ opacity: 0 }}
          animate={
            reduced
              ? undefined
              : {
                  opacity: [0, 0, 1, 0, 0],
                  x: [0, 0, COIN.dx, COIN.dx, COIN.dx],
                  y: [0, 0, COIN.dy, COIN.dy, COIN.dy],
                }
          }
          transition={{ ...LOOP, times: [0, 0.16, 0.4, 0.55, 1], ease: "easeInOut" }}
        >
          $
        </motion.div>

        {/* the member */}
        <div style={{ position: "absolute", left: 28, bottom: 24, width: 64, textAlign: "center" }}>
          <svg viewBox="0 0 72 78" width={64} data-slot="member" aria-hidden="true">
            <circle
              cx={36}
              cy={19}
              r={13}
              fill="var(--riprap-diagram-stone)"
              stroke="var(--riprap-diagram-stone-edge)"
              strokeWidth={3}
            />
            <path
              d="M13 70C13 49 22 39 36 39S59 49 59 70"
              fill="var(--riprap-diagram-stone)"
              stroke="var(--riprap-diagram-stone-edge)"
              strokeWidth={3}
            />
          </svg>
          <div
            style={{
              fontFamily: "var(--riprap-font-prose)",
              fontSize: 12,
              lineHeight: 1.4,
              color: "var(--riprap-diagram-muted)",
            }}
          >
            You
          </div>
        </div>

        {/* the confirmation — the accent arrives last and stays (crest law) */}
        <motion.div
          data-slot="confirmation"
          style={{
            position: "absolute",
            right: 32,
            bottom: 16,
            display: "flex",
            alignItems: "center",
            gap: 6,
            padding: "4px 10px",
            border: "1px solid var(--riprap-accent)",
            font: "var(--riprap-mono-label)",
            fontSize: 10,
            letterSpacing: "var(--riprap-tracking-stamp)",
            textTransform: "uppercase",
            color: "var(--riprap-funds-ink)",
          }}
          initial={reduced ? { opacity: 1 } : { opacity: 0 }}
          // hidden from cycle start, hard cut at the boundary — full-cycle
          // keyframes (delay+repeatDelay modeling would hold the stamp
          // visible through the fresh unsigned cycle). This element's
          // rendered opacity runs ~0.13 cycle ahead of its authored times
          // (measured, stable across fresh loads) — rise authored at 0.55
          // so the rendered arrival sits just AFTER the signature's 0.39
          // completion, never before it (user law).
          animate={reduced ? undefined : { opacity: [0, 0, 1, 1] }}
          transition={{ times: [0, 0.55, 0.62, 1], ease: "easeOut" }}
        >
          <svg
            viewBox="0 0 16 16"
            width={10}
            height={10}
            fill="none"
            data-slot="confirm-check"
            aria-hidden="true"
          >
            <path
              d="M3 8l3 3 7-7"
              stroke="var(--riprap-funds-ink)"
              strokeWidth={2}
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
          You're in
        </motion.div>
      </div>
    </div>
  );
}

function Checkbox({ label }: { label: string }) {
  return (
    <div style={{ display: "flex", alignItems: "center", gap: 8, marginBottom: 8 }}>
      {/* the payout box — NEVER checked (user law): the signature alone
          carries the commitment, so the square renders empty, always */}
      <span
        style={{
          width: 14,
          height: 14,
          flex: "0 0 auto",
          border: "1.5px solid var(--riprap-hairline-strong)",
          borderRadius: 2, // inputs keep 2px (--riprap-radius-input)
        }}
      />
      <span
        style={{
          fontFamily: "var(--riprap-font-prose)",
          fontSize: 12,
          lineHeight: 1.4,
          color: "var(--riprap-diagram-muted)",
        }}
      >
        {label}
      </span>
    </div>
  );
}
