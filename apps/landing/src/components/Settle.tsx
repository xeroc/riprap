import { useInView } from "@riprap/ui";
import type { CSSProperties, ReactNode } from "react";

import { cn } from "./utils";

/**
 * Settle wrapper (DESIGN.md § Motion): the block drops 8px and stops once,
 * on first arrival in the viewport. One unit per band — deadpan, no cascade
 * outside the hero. Reduced-motion visitors get an opacity fade (CSS).
 */
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
  const { ref, inView } = useInView<HTMLDivElement>();
  const style = { "--settle-delay": `${delay}ms` } as CSSProperties;
  return (
    <div
      ref={ref}
      data-settled={inView ? "true" : "false"}
      style={delay ? style : undefined}
      className={cn("settle", className)}
    >
      {children}
    </div>
  );
}
