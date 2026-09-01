import { useInView } from "motion/react";
import { type CSSProperties, type ReactNode, useRef } from "react";

/** Settle (DESIGN.md § Motion): drop 8px and stop, once, on first viewport arrival. */
export function Settle({
  children,
  className,
  delay = 0,
}: {
  children: ReactNode;
  className?: string;
  /** ms — hero stagger only; 30–80ms steps per the motion spec */
  delay?: number;
}) {
  const ref = useRef<HTMLDivElement>(null);
  const inView = useInView(ref, { once: true, amount: 0.2 });
  const style = { "--settle-delay": `${delay}ms` } as CSSProperties;
  return (
    <div
      ref={ref}
      data-settled={inView ? "true" : "false"}
      style={delay ? style : undefined}
      className={["settle", className].filter(Boolean).join(" ")}
    >
      {children}
    </div>
  );
}
