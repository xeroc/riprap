import { useEffect, useRef, useState } from "react";

/**
 * IntersectionObserver presence hook for scroll-arrival motion.
 * One-shot by default (DESIGN.md: figures arrive and stay — nothing loops).
 * Falls back to "in view" where IntersectionObserver is unavailable (jsdom),
 * so content never strands invisible.
 */
export function useInView<T extends HTMLElement>(): {
  ref: React.RefObject<T | null>;
  inView: boolean;
} {
  const ref = useRef<T>(null);
  const [inView, setInView] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;
    if (typeof IntersectionObserver === "undefined") {
      setInView(true);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setInView(true);
            io.disconnect();
          }
        }
      },
      { threshold: 0.2 },
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return { ref, inView };
}
