import { HexBackdrop } from "@riprap/ui";
import { type CSSProperties, useCallback, useEffect, useRef, useState } from "react";

import { SLIDES } from "./deck/slides";

/** The deck is a fixed-proportion presentation designed on a 1440×900
 * canvas, FULL-BLEED: scaled by min(vw/1440, vh/900) then sized vw/scale ×
 * vh/scale, anchored top-left — the HexBackdrop covers the viewport with no
 * letterbox bars and the dimension with surplus gets extra design units.
 * Viewport-relative units inside the canvas are container units (cqw/cqh),
 * never vw/vh — vw ignores ancestor transforms. (Layout engine ported from
 * the accord deck, 2026-09-15.)
 *
 * Below 900px viewport width that uniform scale drops under ~62% and the
 * deck becomes unreadable — so narrow viewports (phones, iPad portrait,
 * split windows) get DOCUMENT MODE instead: every slide stacked at natural
 * size in a scrolling column, tick nav jumps between sections. The same
 * 899px boundary drives the deck-narrow variant in index.css. */
const CANVAS_W = 1440;
const CANVAS_H = 900;
const DOC_MODE_QUERY = "(max-width: 899px)";

function useDocumentMode(): boolean {
  const [doc, setDoc] = useState(
    typeof window === "undefined" ? false : window.matchMedia(DOC_MODE_QUERY).matches,
  );
  useEffect(() => {
    const mq = window.matchMedia(DOC_MODE_QUERY);
    const onChange = () => setDoc(mq.matches);
    onChange();
    mq.addEventListener("change", onChange);
    return () => mq.removeEventListener("change", onChange);
  }, []);
  return doc;
}
function useCanvasBox(): { scale: number; w: number; h: number } {
  const [box, setBox] = useState({ scale: 1, w: CANVAS_W, h: CANVAS_H });
  useEffect(() => {
    const onResize = () => {
      const scale = Math.min(window.innerWidth / CANVAS_W, window.innerHeight / CANVAS_H);
      setBox({ scale, w: window.innerWidth / scale, h: window.innerHeight / scale });
    };
    onResize();
    window.addEventListener("resize", onResize);
    return () => window.removeEventListener("resize", onResize);
  }, []);
  return box;
}

/**
 * App — the deck shell. One HexBackdrop runs behind the entire deck (never
 * unmounts, so the engineering-paper lattice is continuous across slides);
 * each slide mounts fresh with its own frame clock so the kit mechanisms
 * replay on every visit. Keyboard: ← → / space / Home / End; N toggles the
 * presenter notes.
 */
export function App() {
  const [index, setIndex] = useState(0);
  const [showNotes, setShowNotes] = useState(false);
  const [leaving, setLeaving] = useState<number | null>(null);
  const canvas = useCanvasBox();
  const timers = useRef<number[]>([]);

  const go = useCallback((next: number) => {
    setIndex((current) => {
      const clamped = Math.min(SLIDES.length - 1, Math.max(0, next));
      if (clamped === current) {
        return current;
      }
      setLeaving(current);
      for (const t of timers.current) {
        window.clearTimeout(t);
      }
      timers.current = [window.setTimeout(() => setLeaving(null), 220)];
      return clamped;
    });
  }, []);

  const docMode = useDocumentMode();
  const sectionRefs = useRef<(HTMLElement | null)[]>([]);

  useEffect(() => {
    if (docMode) {
      sectionRefs.current[index]?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  }, [docMode, index]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => {
      if (e.key === "ArrowRight" || e.key === " " || e.key === "PageDown") {
        e.preventDefault();
        go(index + 1);
      } else if (e.key === "ArrowLeft" || e.key === "PageUp") {
        e.preventDefault();
        go(index - 1);
      } else if (e.key === "Home") {
        go(0);
      } else if (e.key === "End") {
        go(SLIDES.length - 1);
      } else if (e.key === "n" || e.key === "N") {
        setShowNotes((v) => !v);
      }
    };
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [go, index]);

  useEffect(() => {
    for (const t of timers.current) {
      window.clearTimeout(t);
    }
  }, []);

  const slide = SLIDES[index];
  if (!slide) {
    return null;
  }
  const Active = slide.component;
  const outgoing = leaving !== null ? SLIDES[leaving] : null;
  const Outgoing = outgoing?.component;

  const canvasStyle: CSSProperties = {
    width: `${canvas.w}px`,
    height: `${canvas.h}px`,
    transform: `scale(${canvas.scale})`,
    transformOrigin: "top left",
    containerType: "size",
  };

  if (docMode) {
    return (
      <div className="fixed inset-0 overflow-y-auto overflow-x-hidden bg-canvas">
        <div className="pointer-events-none fixed inset-0 z-0">
          <HexBackdrop className="size-full" />
        </div>
        <main className="relative z-10 flex flex-col gap-[8svh] pb-[8svh]">
          {SLIDES.map((s, i) => {
            const Slide = s.component;
            return (
              <section
                key={s.id}
                ref={(el) => {
                  sectionRefs.current[i] = el;
                }}
                className={`slide flex flex-col *:flex-1 ${i === 0 ? "min-h-[100svh]" : "min-h-[80svh]"}`}
                style={{ containerType: "inline-size" }}
              >
                <Slide />
              </section>
            );
          })}
        </main>
      </div>
    );
  }

  return (
    <div className="fixed inset-0 overflow-hidden bg-canvas">
      <HexBackdrop className="pointer-events-none absolute inset-0 z-0 size-full" />
      {Outgoing ? (
        <div key={outgoing?.id} className="slide-exit absolute inset-0 z-10" style={canvasStyle}>
          <Outgoing />
        </div>
      ) : null}
      <div key={slide.id} className="slide absolute inset-0 z-20" style={canvasStyle}>
        <Active />
      </div>
      {/* presenter chrome: slide counter + notes (N) — mono stamps, hairline */}
      <div className="absolute bottom-6 left-[7cqw] z-30 flex items-center gap-4 text-muted-soft [font:var(--riprap-mono-label)]">
        <span data-num>
          {String(index + 1).padStart(2, "0")} / {String(SLIDES.length - 3).padStart(2, "0")}
        </span>
        <span className="uppercase [letter-spacing:var(--riprap-tracking-stamp)]">
          {slide.label}
        </span>
      </div>
      {/* slide nav — one tick per slide, click to jump (accord deck port, 2026-09-15) */}
      <nav className="absolute right-[7cqw] bottom-6 z-30 flex items-center gap-2">
        {SLIDES.map((s, i) => (
          <button
            key={s.id}
            type="button"
            aria-label={s.label}
            aria-current={i === index ? "page" : undefined}
            onClick={() => go(i)}
            className={`relative h-1.5 outline-none after:absolute after:-inset-x-1 after:-inset-y-2 after:content-[''] focus-visible:ring-3 focus-visible:ring-ring [transition:width_var(--riprap-settle),background-color_var(--riprap-settle)] ${
              i === index
                ? "w-8 bg-accent active:bg-accent-hover"
                : "w-3 bg-hairline-strong hover:bg-muted-soft active:bg-muted"
            }`}
          />
        ))}
      </nav>
      {showNotes ? (
        <div className="absolute inset-x-0 bottom-0 z-40 border-t border-hairline bg-(--riprap-canvas-deep) px-[7cqw] py-5">
          <div className="mx-auto max-w-[120ch] text-muted [font:var(--riprap-body-sm)]">
            <span className="mb-1 block uppercase text-accent [font:var(--riprap-mono-label)] [letter-spacing:var(--riprap-tracking-stamp)]">
              notes — {slide.label}
            </span>
            {slide.notes}
          </div>
        </div>
      ) : null}
    </div>
  );
}

export default App;
