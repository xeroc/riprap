import { motion, useReducedMotion } from "motion/react";
import type { CSSProperties, ReactNode } from "react";
import { VESSEL, VesselLines } from "./Glyph";

/**
 * ClaimApproval — the payout story in one stage: claim submitted → jury
 * reviews against the original purpose → the stamp lands → funds released
 * from the pool back to the member.
 *
 * Brought in from an external demo, restyled to DESIGN.md: token colors
 * only (adjudication = `deliberation`, money = `funds`), the person is
 * stone, mono stamps (every numeral mono), hairline depth, connectors
 * drawn as SVG (text-glyph arrows are out), no CSS file — inline styles.
 * Choreography is ported EXACTLY as authored (8s loop, all keyframe times
 * including the cycle-end reversals — fine tuning stays with the author);
 * the only structural additions are terminal keyframes at offset 1 where
 * the original stopped early (WAAPI pads a missing tail back toward the
 * base value otherwise).
 *
 * Same user-sanctioned exception to the no-loops law as HexBackdrop.
 * Under prefers-reduced-motion the scene renders the completed payout as
 * one static frame: everything signed and stamped, pool drained, funds
 * received. ponytail: no glyph-clock twin — add one if a video needs it.
 */

const D = 8;

/** one loop: full duration, mirrored easings per segment as authored */
const LOOP = { duration: D, repeat: Infinity, repeatDelay: 30 };

export function ClaimApproval({ className }: { className?: string }) {
  const reduced = useReducedMotion();

  return (
    <div data-slot="claim-approval" className={className} style={{ width: "100%", maxWidth: 960 }}>
      <div
        style={{
          position: "relative",
          width: "100%",
          aspectRatio: "16 / 9",
          minHeight: 340,
          overflow: "hidden",
        }}
      >
        <Dots />

        {/* the three beats — mono stamps, each fading in with its moment:
            submit with the claim, review with the panel, payout once the
            approval stamp has landed (user law) */}
        <Step label="01 · Submit" style={{ left: "5%" }} fadeAt={[0.06, 0.12]} reduced={reduced} />
        <Step label="02 · Review" style={{ left: "40%" }} fadeAt={[0.16, 0.22]} reduced={reduced} />
        <Step label="03 · Payout" style={{ left: "76%" }} fadeAt={[0.56, 0.62]} reduced={reduced} />

        {/* the claim — submitted by the member */}
        <motion.div
          data-slot="claim-paper"
          style={{ position: "absolute", left: "4%", top: "21%", width: "23%" }}
          initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 10 }}
          animate={reduced ? undefined : { opacity: [0, 1, 1, 1, 1], y: [10, 0, 0, 0, 0] }}
          transition={{ ...LOOP, times: [0, 0.1, 0.85, 0.92, 1], ease: "easeIn" }}
        >
          <Paper
            eyebrow="Submitted"
            title="Claim"
            checks={["Request details", "Supporting evidence"]}
            reduced={reduced}
          >
            <SignatureLine />
          </Paper>
        </motion.div>

        <motion.div
          animate={{ opacity: [0, 0, 1, 1] }}
          transition={{ ...LOOP, times: [0, 0.1, 0.85, 0.92, 1], ease: "easeOut" }}
        >
          <Connector style={{ left: "31%", top: "39%" }} stroke="var(--riprap-deliberation)" />
        </motion.div>

        {/* the review column — the original agreement, reviewed and signed.
            No panel box around it (user law): the paper stands alone, top
            aligned with the claim paper; the wrapper only anchors the stamp. */}
        <motion.div
          data-slot="jury-panel"
          style={{ position: "absolute", left: "31%", top: "21%", width: "39%" }}
          initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0.3, y: 8 }}
          animate={reduced ? undefined : { opacity: [0, 1, 1, 1, 1], y: [8, 0, 0, 0, 0] }}
          transition={{ ...LOOP, times: [0, 0.2, 0.86, 0.92, 1], ease: "easeIn" }}
        >
          <div style={{ display: "flex", justifyContent: "center" }}>
            <div style={{ width: "62%" }}>
              <Paper
                eyebrow="Original agreement"
                title="Purpose"
                checks={["Purpose matches", "Evidence checked", "Terms satisfied"]}
                reduced={reduced}
              >
                <JurorSignatures reduced={reduced} />
              </Paper>
            </div>
          </div>
          {/* the ruling stamp — lands once the jurors have signed */}
          <motion.div
            data-slot="approval-stamp"
            style={{
              position: "absolute",
              zIndex: 2,
              right: "3%",
              bottom: "17%",
              padding: "8px 5px",
              border: "2px solid var(--riprap-deliberation)",
              borderRadius: "50%",
              background: "var(--riprap-surface-card)",
              color: "var(--riprap-deliberation)",
              fontFamily: "var(--riprap-font-mono)",
              fontWeight: 700,
              fontSize: "clamp(7px, 1.1vw, 11px)",
              letterSpacing: "var(--riprap-tracking-stamp)",
              textTransform: "uppercase",
            }}
            initial={
              reduced
                ? { opacity: 1, scale: 1, rotate: -8 }
                : { opacity: 0, scale: 0.4, rotate: -12 }
            }
            animate={
              reduced
                ? undefined
                : {
                  opacity: [0, 0, 0, 1, 1, 1],
                  scale: [0.4, 0.4, 0.4, 1, 1, 1],
                  rotate: [-12, -12, -12, -8, -8, -8],
                }
            }
            transition={{ ...LOOP, times: [0, 0.47, 0.3, 0.34, 0.86, 1], ease: "easeIn" }}
          >
            Approved
          </motion.div>
        </motion.div>

        <motion.div
          initial={{ opacity: 1 }}
          animate={{ opacity: [0, 0, 1, 1] }}
          transition={{ ...LOOP, times: [0, 0.56, 0.62, 1], ease: "easeOut" }}
        >
          <Connector style={{ left: "67%", top: "39%" }} stroke="var(--riprap-funds)" />
        </motion.div>

        {/* the member */}
        <motion.div
          style={{
            position: "absolute",
            left: "85%",
            top: "20%",
            transform: "translateX(-50%)",
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            gap: 2,
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: [0, 0, 1, 1] }}
          transition={{ ...LOOP, times: [0, 0.56, 0.62, 1], ease: "easeOut" }}
        >
          <svg viewBox="0 0 72 78" width={44} data-slot="member" aria-hidden="true">
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
          <span
            style={{
              fontFamily: "var(--riprap-font-prose)",
              fontWeight: 500,
              fontSize: 11,
              color: "var(--riprap-diagram-muted)",
            }}
          >
            You
          </span>
        </motion.div>

        {/* funds released — money arriving back at the member */}
        <div
          style={{
            position: "absolute",
            left: "85%",
            top: "85%",
            transform: "translateX(-50%)",
          }}
        >
          <motion.div
            data-slot="paid-badge"
            style={{
              whiteSpace: "nowrap",
              display: "flex",
              alignItems: "center",
              gap: 5,
              padding: "7px 10px",
              border: "1px solid var(--riprap-funds)",
              borderRadius: 999,
              background: "var(--riprap-surface-card)",
              fontFamily: "var(--riprap-font-prose)",
              fontWeight: 700,
              fontSize: 10,
              color: "var(--riprap-funds-ink)",
            }}
            initial={reduced ? { opacity: 1, y: 0 } : { opacity: 0, y: 6 }}
            animate={reduced ? undefined : { opacity: [0, 0, 0, 1, 1, 1], y: [6, 6, 6, 0, 0, 0] }}
            transition={{ ...LOOP, times: [0, 0.72, 0.76, 0.8, 0.91, 1], ease: "easeOut" }}
          >
            <svg viewBox="0 0 16 16" width={10} height={10} fill="none" aria-hidden="true">
              <path
                d="M3 8l3 3 7-7"
                stroke="var(--riprap-funds-ink)"
                strokeWidth={2}
                strokeLinecap="round"
                strokeLinejoin="round"
              />
            </svg>
            Funds released
          </motion.div>
        </div>

        {/* the pool — identical to FundingPool's: the kit's open-top vessel,
            the level draining as the payout leaves (52% → 27% of interior) */}
        <motion.div
          style={{
            position: "absolute",
            left: "85%",
            top: "60%",
            transform: "translateX(-50%)",
            width: "14.5%", // ≈140px at the 960 full size; scales with the stage
          }}
          initial={{ opacity: 1 }}
          animate={{ opacity: [0, 0, 1, 1] }}
          transition={{ ...LOOP, times: [0, 0.56, 0.62, 1], ease: "easeOut" }}
        >
          <svg viewBox="22 26 52 48" width="100%" data-slot="pool-vessel" aria-hidden="true">
            <VesselLines />
            <VesselWater reduced={reduced} />
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
        </motion.div>

        {/* the coin — travels straight up from the pool to You */}
        <motion.div
          data-slot="payout-coin"
          style={{
            position: "absolute",
            zIndex: 3,
            left: "85%",
            margin: "-15px 0 0 -15px",
            top: "68%",
            display: "grid",
            placeItems: "center",
            width: 30,
            height: 30,
            border: "2px solid var(--riprap-funds-ink)",
            borderRadius: "50%",
            background: "var(--riprap-funds)",
            color: "var(--riprap-on-primary)",
            font: "800 18px var(--riprap-font-mono)",
          }}
          initial={reduced ? { opacity: 0 } : { opacity: 0, scale: 0.7 }}
          animate={
            reduced
              ? undefined
              : {
                top: ["68%", "68%", "68%", "34%", "34%", "34%"],
                opacity: [0, 0, 1, 1, 0, 0],
                scale: [0.7, 0.7, 1, 1, 0.8, 0.8],
              }
          }
          transition={{ ...LOOP, times: [0, 0.55, 0.61, 0.75, 0.84, 1], ease: "easeInOut" }}
        >
          $
        </motion.div>
      </div>
    </div>
  );
}

/** the engineering-paper dot grid (an SVG pattern — gradients are banned) */
function Dots() {
  return (
    <svg
      aria-hidden="true"
      data-slot="dot-grid"
      style={{ position: "absolute", inset: 0, width: "100%", height: "100%" }}
    >
      <defs>
        <pattern id="riprap-ca-dots" width={20} height={20} patternUnits="userSpaceOnUse">
          <circle cx={1} cy={1} r={0.7} fill="var(--riprap-hairline-soft)" />
        </pattern>
      </defs>
      <rect width="100%" height="100%" fill="url(#riprap-ca-dots)" />
    </svg>
  );
}

function Step({
  label,
  style,
  fadeAt,
  reduced,
}: {
  label: string;
  style: CSSProperties;
  /** [start, done] as cycle fractions — each step arrives with its beat */
  fadeAt: [number, number];
  reduced: boolean | null;
}) {
  return (
    <motion.div
      data-slot="ca-step"
      style={{
        position: "absolute",
        top: "6%",
        ...style,
        font: "var(--riprap-mono-label)",
        fontSize: 10,
        letterSpacing: "var(--riprap-tracking-stamp)",
        textTransform: "uppercase",
        color: "var(--riprap-diagram-muted)",
      }}
      initial={reduced ? { opacity: 1 } : { opacity: 0 }}
      animate={reduced ? undefined : { opacity: [0, 0, 1, 1] }}
      transition={{ ...LOOP, times: [0, fadeAt[0], fadeAt[1], 1], ease: "easeOut" }}
    >
      {label}
    </motion.div>
  );
}

/** the pool's level — the same vessel fill as FundingPool, here draining:
 *  the payout leaves, the level falls and holds (52% → 27% of interior) */
const FULL_LEVEL = 0.52 * VESSEL.fill.fullHeight;
const DRAINED_LEVEL = 0.27 * VESSEL.fill.fullHeight;

function VesselWater({ reduced }: { reduced: boolean | null }) {
  const floor = VESSEL.fill.floorY;
  return (
    <motion.rect
      data-slot="pool-water"
      x={VESSEL.fill.x}
      width={VESSEL.fill.width}
      fill="var(--riprap-funds)"
      initial={
        reduced
          ? { height: DRAINED_LEVEL, y: floor - DRAINED_LEVEL }
          : { height: FULL_LEVEL, y: floor - FULL_LEVEL }
      }
      animate={
        reduced
          ? undefined
          : {
            height: [FULL_LEVEL, FULL_LEVEL, FULL_LEVEL, DRAINED_LEVEL, DRAINED_LEVEL],
            y: [
              floor - FULL_LEVEL,
              floor - FULL_LEVEL,
              floor - FULL_LEVEL,
              floor - DRAINED_LEVEL,
              floor - DRAINED_LEVEL,
            ],
          }
      }
      transition={{ ...LOOP, times: [0, 0.5, 0.57, 0.75, 1], ease: "easeInOut" }}
    />
  );
}

/** a drawn connector — deliberation for review, funds for money (composition.md) */
function Connector({ style, stroke }: { style: CSSProperties; stroke: string }) {
  return (
    <svg
      aria-hidden="true"
      data-slot="connector-arrow"
      viewBox="0 0 24 24"
      width={24}
      style={{ position: "absolute", ...style }}
    >
      <path
        d="M1 12H19M13 5l7 7-7 7"
        fill="none"
        stroke={stroke}
        strokeWidth={3}
        strokeLinecap="butt"
        strokeLinejoin="miter"
      />
    </svg>
  );
}

/** one reviewed document — eyebrow, title, ruled lines, checks */
function Paper({
  eyebrow,
  title,
  checks,
  reduced,
  children,
}: {
  eyebrow: string;
  title: string;
  checks: string[];
  reduced: boolean | null;
  children: ReactNode;
}) {
  return (
    <div
      data-slot="ca-paper"
      style={{
        position: "relative",
        minWidth: 0,
        padding: "12px 10px",
        border: "1px solid var(--riprap-hairline-strong)",
        borderRadius: 6,
        background: "var(--riprap-surface-card)",
      }}
    >
      <div
        style={{
          font: "var(--riprap-mono-label)",
          fontSize: "clamp(6px, 0.85vw, 9px)",
          letterSpacing: "var(--riprap-tracking-stamp)",
          textTransform: "uppercase",
          color: "var(--riprap-diagram-muted)",
          overflowWrap: "anywhere",
        }}
      >
        {eyebrow}
      </div>
      <h3
        style={{
          margin: "6px 0",
          fontFamily: "var(--riprap-font-prose)",
          fontWeight: 500,
          fontSize: "clamp(11px, 1.5vw, 15px)",
          color: "var(--riprap-diagram-ink)",
        }}
      >
        {title}
      </h3>
      <div style={{ height: 1, margin: "8px 0", background: "var(--riprap-hairline)" }} />
      <div>
        <i
          style={{
            display: "block",
            height: 4,
            marginTop: 6,
            borderRadius: 3,
            background: "var(--riprap-hairline-soft)",
          }}
        />
        <i
          style={{
            display: "block",
            height: 4,
            marginTop: 6,
            width: "78%",
            borderRadius: 3,
            background: "var(--riprap-hairline-soft)",
          }}
        />
        <i
          style={{
            display: "block",
            height: 4,
            marginTop: 6,
            width: "90%",
            borderRadius: 3,
            background: "var(--riprap-hairline-soft)",
          }}
        />
      </div>
      {checks.map((c, i) => (
        <CheckRow key={c} label={c} delay={2.1 + i * 0.35} reduced={reduced} />
      ))}
      {children}
    </div>
  );
}

function CheckRow({
  label,
  delay,
  reduced,
}: {
  label: string;
  delay: number;
  reduced: boolean | null;
}) {
  return (
    <div
      style={{
        display: "flex",
        alignItems: "center",
        gap: 5,
        marginTop: 9,
        fontFamily: "var(--riprap-font-prose)",
        fontSize: "clamp(7px, 0.95vw, 10px)",
        color: "var(--riprap-diagram-ink)",
        overflowWrap: "anywhere",
      }}
    >
      <span
        style={{
          display: "grid",
          placeItems: "center",
          flex: "0 0 13px",
          width: 13,
          height: 13,
          border: "1px solid var(--riprap-deliberation)",
          borderRadius: 2,
        }}
      >
        <motion.svg
          viewBox="0 0 16 16"
          width={12}
          height={12}
          initial={reduced ? { opacity: 1 } : { opacity: 0 }}
          animate={reduced ? undefined : { opacity: [0, 0, 1, 1, 0] }}
          transition={{
            ...LOOP,
            times: [0, delay / D, (delay + 0.3) / D, 0.88, 1],
            ease: "easeInOut",
          }}
        >
          <path
            d="M3 8l3 3 7-7"
            fill="none"
            stroke="var(--riprap-deliberation)"
            strokeWidth={2}
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </motion.svg>
      </span>
      {label}
    </div>
  );
}

/** the claimant's signature — static, as authored */
function SignatureLine() {
  return (
    <div
      style={{
        marginTop: 10,
        borderTop: "1px dashed var(--riprap-hairline-strong)",
      }}
    >
      <svg viewBox="0 0 120 32" width="100%" height={28} fill="none" aria-hidden="true">
        <path
          d="M4 23Q13 -2 17 20T36 13Q43 4 40 22T60 13Q69 6 65 20T88 14L115 17"
          stroke="var(--riprap-diagram-ink)"
          strokeWidth={1.8}
          strokeLinecap="round"
        />
      </svg>
    </div>
  );
}

/** three jurors, signing one after another */
function JurorSignatures({ reduced }: { reduced: boolean | null }) {
  const sigs = [
    "M5 19C1 8 7 1 11 4C15 8 8 20 13 17C19 13 20 9 24 14C27 18 30 9 33 12C36 15 40 13 44 11L57 10M20 8L34 6",
    "M5 4L9 18L13 6L17 18L21 5M24 12H44M27 9L38 18M5 21Q28 17 56 21",
    "M3 13Q8 9 13 13T23 13T33 13T43 13M44 13C52 -2 59 20 49 17C45 15 52 9 56 9M30 4L30.2 4",
  ];
  return (
    <div
      style={{
        marginTop: 10,
        borderTop: "1px dashed var(--riprap-hairline-strong)",
      }}
    >
      <div style={{ display: "flex", gap: 6, paddingTop: 4 }}>
        {sigs.map((d, i) => (
          <div key={d} style={{ flex: 1, minWidth: 0, textAlign: "center" }}>
            <svg viewBox="0 0 60 24" width="100%" height={22} fill="none" aria-hidden="true">
              <motion.path
                data-slot="juror-signature"
                d={d}
                stroke="var(--riprap-deliberation)"
                strokeWidth={i === 1 ? 2 : i === 2 ? 1.6 : 1.3}
                strokeLinecap="round"
                strokeLinejoin="round"
                pathLength={1}
                initial={reduced ? { pathLength: 1 } : { pathLength: 0 }}
                animate={reduced ? undefined : { pathLength: [0, 0, 1, 1, 1] }}
                transition={{
                  ...LOOP,
                  times: [0, (2.7 + i * 0.35) / D, (2.7 + i * 0.35 + 0.4) / D, 0.88, 1],
                  ease: "easeIn",
                }}
              />
            </svg>
            <div
              style={{
                font: "var(--riprap-mono-label)",
                fontSize: "clamp(5px, 0.7vw, 7px)",
                color: "var(--riprap-diagram-muted)",
                textTransform: "uppercase",
              }}
            >
              Juror {i + 1}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
}
