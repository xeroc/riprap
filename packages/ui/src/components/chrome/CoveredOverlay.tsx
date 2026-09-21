import { motion, useReducedMotion } from "motion/react";
import { Dialog as DialogPrimitive } from "radix-ui";
import type * as React from "react";
import { useEffect, useMemo, useState } from "react";

import { SETTLE, settle } from "../../illustrations/Glyph";
import { Button } from "../ui/button";
import { BadgeStamp } from "./BadgeStamp";
import { Logomark } from "./Logomark";

/**
 * `CoveredOverlay` — the join moment (copy doc § Covered overlay), the one
 * sanctioned motion exception (DESIGN.md § Motion, 2026-09-21: Fabian's
 * call — this moment borrows the demo choreography). Sequence: ambient
 * hairline rings emit, the shield drops in (overshoot), the peril diamond
 * flies in and shatters against it (flash + shard spray), confetti lands,
 * THEN the ring closes — the harbor-blue newest member settles into the open
 * slot last — and the copy arrives: stamp, glowing headline, the money
 * figures one at a time, the juror field, Continue. Everything else on the
 * page blurs behind a fullscreen scrim: no card, no border box.
 *
 * Reduced motion collapses to the settled composite (ring settled + copy, no
 * scene). The kit stays copy-free: every word and figure arrives as props.
 */
export interface CoveredOverlayProps {
  open: boolean;
  /** Continue, Escape, and scrim dismissal — one exit path */
  onDismiss: () => void;
  /** stamp line, e.g. "Covered — Standard" — mono badge stamp, data-num */
  stamp: string;
  /** display headline, e.g. "You're in the ring." — arrives with the glow */
  headline: string;
  /** money figures — the page composes each phrase; rows settle sequentially */
  figures: React.ReactNode[];
  /** the juror recruitment field — label, body, and the outline action */
  juror: { label: string; body: React.ReactNode; action: string; href: string };
  /** dismiss button label (default "Continue") */
  continueLabel?: string;
}

/** Timeline (seconds) — mirrors the demo's choreography. */
const T = {
  shieldIn: 0.15,
  diamond: 0.55,
  impact: 1.17,
  confetti: 1.3,
  ring: 1.5,
  stamp: 2.1,
  headline: 2.2,
} as const;
const FIGURE_STEP = SETTLE + 0.02;

/** The demo's bounce-in (deliberate exception — DESIGN.md § Motion note). */
const BOUNCE = [0.2, 1.4, 0.4, 1] as const;
/** The demo's threat easing: accelerating, no mercy. */
const HURDLE = [0.5, 0, 0.75, 0] as const;

/** Sprites regenerate per open — every replay is a different shatter. */
function useSprites(open: boolean) {
  return useMemo(
    () => ({
      shards: Array.from({ length: 10 }, () => ({
        angle: Math.random() * 70 - 35,
        dist: 50 + Math.random() * 40,
      })),
      confetti: Array.from({ length: 16 }, (_, i) => ({
        x: Math.random() * 260 - 130,
        y: 80 + Math.random() * 90,
        rot: Math.random() * 540 - 270,
        color: [
          "var(--riprap-ink)",
          "var(--riprap-accent)",
          "var(--riprap-stone)",
          "var(--riprap-muted)",
        ][i % 4],
      })),
    }),
    // eslint-disable-next-line react-hooks/exhaustive-deps
    [open],
  );
}

function Arrive({
  at,
  className,
  as: Tag = motion.div,
  children,
}: {
  at: number;
  className?: string;
  as?: typeof motion.div | typeof motion.h2;
  children: React.ReactNode;
}) {
  const reduce = useReducedMotion();
  if (reduce) {
    const Still = Tag === motion.h2 ? "h2" : "div";
    return <Still className={className}>{children}</Still>;
  }
  return (
    <Tag
      className={className}
      initial={{ opacity: 0, y: 8 }}
      animate={{ opacity: 1, y: 0 }}
      transition={settle(at)}
    >
      {children}
    </Tag>
  );
}

/** The scene: rings, shield, diamond, flash, shards, confetti — aria-hidden
 *  decoration; the ring is the payoff and renders last. */
function Scene({ open, ringOn }: { open: boolean; ringOn: boolean }) {
  const { shards, confetti } = useSprites(open);

  return (
    <div
      aria-hidden="true"
      data-slot="covered-scene"
      className="relative flex h-[220px] w-[220px] items-center justify-center"
    >
      {/* ambient hairline emissions — loop while open (the exception note).
          SVG circles: the scene is illustration, not chrome geometry. */}
      <svg viewBox="0 0 220 220" role="presentation" className="absolute inset-0 size-full">
        {[0, 0.6, 1.2].map((offset) => (
          <motion.circle
            key={offset}
            cx={110}
            cy={110}
            fill="none"
            stroke="var(--riprap-hairline-strong)"
            strokeWidth={1}
            initial={{ opacity: 0, r: 44 }}
            animate={{ opacity: [0.5, 0], r: [44, 72] }}
            transition={{ duration: 2.6, delay: offset, repeat: Infinity, ease: "easeOut" }}
          />
        ))}
      </svg>

      {/* the peril diamond: flies in, rotating, and shatters on the shield */}
      <motion.span
        data-slot="covered-threat"
        className="absolute left-0 top-1/2 block size-[34px]"
        initial={{ x: "-40px", y: "-50%", opacity: 0, rotate: 20, scale: 0.8 }}
        animate={{ x: "63px", opacity: [0, 1, 1, 0], rotate: 380, scale: [0.8, 1, 1, 1.6] }}
        transition={{
          duration: 0.87,
          delay: T.diamond,
          times: [0, 0.08, 0.71, 1],
          ease: HURDLE,
        }}
      >
        <svg viewBox="0 0 34 34" role="presentation" className="size-full">
          <polygon
            points="17,0 34,17 17,34 0,17"
            fill="none"
            stroke="var(--riprap-peril)"
            strokeWidth="2.5"
          />
          <polygon points="17,8 26,17 17,26 8,17" fill="var(--riprap-peril)" opacity="0.85" />
        </svg>
      </motion.span>

      {/* the shield: bounce-in, then the impact pulse with its one glow */}
      <motion.span
        data-slot="covered-shield"
        className="relative z-3 block size-24"
        initial={{ scale: 0 }}
        animate={{ scale: [0, 1, 1.16, 1] }}
        transition={{
          duration: 0.88,
          times: [0, 0.57, 0.77, 1],
          delay: T.shieldIn,
          ease: BOUNCE,
        }}
        style={{
          filter: "drop-shadow(0 0 18px color-mix(in srgb, var(--riprap-accent) 55%, transparent))",
        }}
      >
        <svg viewBox="0 0 96 96" role="presentation" className="size-full">
          <path
            d="M48 4 L88 18 V46 C88 70 70 86 48 94 C26 86 8 70 8 46 V18 Z"
            fill="var(--riprap-surface-strong)"
            stroke="var(--riprap-accent)"
            strokeWidth="3"
          />
          <path
            d="M32 48 L44 60 L66 34"
            fill="none"
            stroke="var(--riprap-accent)"
            strokeWidth="6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
        </svg>
      </motion.span>

      {/* impact flash — SVG circle, scene illustration */}
      <svg viewBox="0 0 220 220" role="presentation" className="absolute inset-0 z-4 size-full">
        <motion.circle
          data-slot="covered-flash"
          cx={110}
          cy={110}
          fill="var(--riprap-accent)"
          initial={{ opacity: 0, r: 2 }}
          animate={{ opacity: [1, 0.9, 0], r: [2, 30, 55] }}
          transition={{ duration: 0.5, delay: T.impact, ease: "easeOut" }}
        />
      </svg>

      {/* shard spray — the diamond's fragments, peril-colored */}
      {shards.map((s, i) => (
        <motion.span
          key={`shard-${i}`}
          data-slot="covered-shard"
          className="absolute left-1/2 top-1/2 z-4 block size-2 bg-(--riprap-peril)"
          initial={{ opacity: 1 }}
          animate={{
            opacity: [1, 0],
            x: [0, Math.cos((s.angle * Math.PI) / 180) * s.dist],
            y: [0, Math.sin((s.angle * Math.PI) / 180) * s.dist],
            scale: [1, 0.3],
          }}
          transition={{ duration: 0.6, delay: T.impact, ease: "easeOut" }}
        />
      ))}

      {/* confetti — ink, accent, stone, muted; sharp engineering bits */}
      {confetti.map((c, i) => (
        <motion.span
          key={`confetti-${i}`}
          data-slot="covered-confetti"
          className="absolute left-1/2 top-1/2 z-5 block h-[10px] w-[6px]"
          style={{ background: c.color }}
          initial={{ opacity: 1 }}
          animate={{ opacity: [1, 0], x: [0, c.x], y: [0, c.y], rotate: [0, c.rot] }}
          transition={{ duration: 1.3, delay: T.confetti, ease: "easeOut" }}
        />
      ))}

      {/* the closing circle — the payoff; mounts once the action settles */}
      {ringOn ? (
        <motion.span
          data-slot="covered-ring"
          className="absolute inset-0 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          transition={settle(0)}
        >
          <Logomark size={200} state="assemble" />
        </motion.span>
      ) : null}
    </div>
  );
}

export function CoveredOverlay({
  open,
  onDismiss,
  stamp,
  headline,
  figures,
  juror,
  continueLabel = "Continue",
}: CoveredOverlayProps) {
  const reduce = useReducedMotion();
  // The ring mounts when the action beats are done — its stones animate from
  // mount, so a delayed mount IS the delayed start.
  const [ringOn, setRingOn] = useState(reduce ?? false);
  useEffect(() => {
    if (reduce || !open) return;
    setRingOn(false);
    const t = window.setTimeout(() => setRingOn(true), T.ring * 1000);
    return () => window.clearTimeout(t);
  }, [open, reduce]);

  const figuresStart = T.headline + SETTLE + 0.01;
  const afterFigures = figuresStart + figures.length * FIGURE_STEP;

  return (
    <DialogPrimitive.Root open={open} onOpenChange={(next) => !next && onDismiss()}>
      <DialogPrimitive.Portal>
        {/* fullscreen: the page blurs behind a tone scrim — no card, no box */}
        <DialogPrimitive.Overlay asChild>
          <motion.span
            data-slot="covered-scrim"
            className="fixed inset-0 z-50 bg-(--riprap-canvas)/70 backdrop-blur-[6px]"
            initial={{ opacity: 0 }}
            animate={{ opacity: 1 }}
            transition={{ duration: 0.35, ease: "easeOut" }}
          />
        </DialogPrimitive.Overlay>
        <DialogPrimitive.Content className="fixed inset-0 z-50 flex items-center justify-center outline-none">
          <div className="flex max-w-sm flex-col items-center gap-(--riprap-space-lg) px-6 text-center">
            {reduce ? (
              <div
                data-slot="covered-scene"
                aria-hidden="true"
                className="flex items-center justify-center"
              >
                <Logomark size={200} state="settled" />
              </div>
            ) : (
              <Scene open={open} ringOn={ringOn} />
            )}
            <Arrive at={T.stamp}>
              <BadgeStamp data-num>{stamp}</BadgeStamp>
            </Arrive>
            <DialogPrimitive.Title asChild>
              <Arrive
                at={T.headline}
                className="tracking-(--riprap-tracking-display) text-ink [font:var(--riprap-display-sm)]"
                as={motion.h2}
              >
                <span
                  data-slot="covered-headline"
                  style={{
                    textShadow:
                      "0 0 24px color-mix(in srgb, var(--riprap-accent) 45%, transparent)",
                  }}
                >
                  {headline}
                </span>
              </Arrive>
            </DialogPrimitive.Title>
            {/* the stamp is the screen-reader context for the moment */}
            <DialogPrimitive.Description className="sr-only">{stamp}</DialogPrimitive.Description>
            <div className="flex flex-col gap-(--riprap-space-xs)" data-slot="covered-figures">
              {figures.map((figure, i) => (
                <Arrive
                  key={i}
                  at={figuresStart + i * FIGURE_STEP}
                  className="text-body [font:var(--riprap-body-md)]"
                >
                  {figure}
                </Arrive>
              ))}
            </div>
            <Arrive at={afterFigures} className="w-full">
              <div
                data-slot="covered-juror"
                className="flex flex-col items-center gap-(--riprap-space-sm) rounded-none border border-hairline bg-strong px-4 py-4"
              >
                <p className="uppercase tracking-(--riprap-tracking-stamp) text-muted-soft [font:var(--riprap-mono-label)]">
                  {juror.label}
                </p>
                <p className="leading-relaxed text-body [font:var(--riprap-body-sm)]">
                  {juror.body}
                </p>
                <Button variant="outline" asChild>
                  <a href={juror.href}>{juror.action}</a>
                </Button>
              </div>
            </Arrive>
            <Arrive at={afterFigures + 0.06}>
              <Button data-slot="covered-continue" onClick={onDismiss}>
                {continueLabel}
              </Button>
            </Arrive>
          </div>
        </DialogPrimitive.Content>
      </DialogPrimitive.Portal>
    </DialogPrimitive.Root>
  );
}
