import { TIERS, usd } from "@riprap/ui";
import { useCurrentFrame, useVideoConfig } from "remotion";

import { settleStyle } from "../../shell/anim";
import { JOIN_FIGURE_CAPTION, JOIN_HEADLINE, JOIN_SUB } from "../copy";
import { Num, Scene } from "../scene";

/** S2 · CHIP IN (f120–300) — the tier table as full-width typography.
 * Data straight from the kit's TIERS (policy §5); Standard carries the
 * plate, the others recede (composition.md: highlight one thing). */
export function JoinScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Scene backdropAnchor={0.5}>
      <h2
        className="m-0 text-8xl font-bold tracking-tight text-ink"
        style={settleStyle(frame, fps, 0.1)}
      >
        {JOIN_HEADLINE}
      </h2>
      <p className="m-0 text-4xl text-body" style={settleStyle(frame, fps, 0.35)}>
        {JOIN_SUB}
      </p>
      <div className="flex w-[1720px] flex-col gap-4">
        {TIERS.map((tier, i) => (
          <div
            className={`flex items-baseline justify-between gap-14 px-12 py-7 ${
              tier.name === "Standard"
                ? "border-y border-hairline bg-card"
                : "border-y border-transparent opacity-55"
            }`}
            style={settleStyle(frame, fps, 0.6 + i * 0.15)}
          >
            <span className="w-[360px] text-left font-mono text-4xl uppercase tracking-(--riprap-tracking-stamp) text-body">
              {tier.name}
            </span>
            <span
              data-num
              className="text-8xl font-semibold leading-none text-(--riprap-funds-ink)"
            >
              {usd(tier.fee)}
            </span>
            <span className="font-mono text-4xl text-muted">→</span>
            <span className="font-mono text-3xl text-muted">up to</span>
            <span
              data-num
              className="text-8xl font-semibold leading-none text-(--riprap-funds-ink)"
            >
              {usd(tier.cap)}
            </span>
          </div>
        ))}
      </div>
      <p className="m-0 font-mono text-3xl text-body" style={settleStyle(frame, fps, 1.2)}>
        {JOIN_FIGURE_CAPTION.split(/(\$\d[\d,]*)/).map((part, i) =>
          part.startsWith("$") ? (
            // biome-ignore lint/suspicious/noArrayIndexKey: static caption split — position is identity, list never reorders
            <Num key={i} funds>
              {part}
            </Num>
          ) : (
            // biome-ignore lint/suspicious/noArrayIndexKey: static caption split — position is identity, list never reorders
            <span key={i}>{part}</span>
          ),
        )}
      </p>
    </Scene>
  );
}
