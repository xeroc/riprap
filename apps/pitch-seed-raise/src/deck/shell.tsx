import type { FC, ReactNode } from "react";

/**
 * SlideFrame — the shared slide layout: kicker (mono stamp, harbor-blue),
 * headline, content. Children stagger in via [data-rise]; the whole slide
 * settles on the brand curve. One idea per slide, big type, no walls of text.
 * Headlines are statements; the kicker names the slide (2026-09-17 swap).
 */
export const SlideFrame: FC<{
  kicker?: string;
  headline: ReactNode;
  children?: ReactNode;
  align?: "left" | "center";
}> = ({ kicker, headline, children, align = "left" }) => (
  <div
    className={`flex h-full w-full flex-col justify-center gap-10 px-[7cqw]${
      align === "center" ? " items-center text-center" : ""
    }`}
  >
    <div
      data-rise
      className="flex flex-col gap-5"
      style={align === "center" ? { alignItems: "center" } : undefined}
    >
      {kicker ? (
        <div className="uppercase text-accent [font:var(--riprap-mono-label)] [letter-spacing:var(--riprap-tracking-stamp)]">
          {kicker}
        </div>
      ) : null}
      <h2 className="max-w-[24ch] text-ink [font:var(--riprap-display-xl)] [letter-spacing:var(--riprap-tracking-display)]">
        {headline}
      </h2>
    </div>
    {children ? (
      <div data-rise className="flex flex-col gap-8">
        {children}
      </div>
    ) : null}
  </div>
);
