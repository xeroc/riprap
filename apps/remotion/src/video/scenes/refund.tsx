import { useCurrentFrame, useVideoConfig } from "remotion";

import { settleStyle } from "../../shell/anim";
import { REFUND_HOOK_POST, REFUND_HOOK_PRE } from "../copy";
import { Scene } from "../scene";

/** S5 · REFUND (f720–840) — the payoff, plain: whatever is left comes back.
 * No glyph, no dissolution detail — two lines, easy to read: the hook,
 * then the per-member number it works out to (policy §10: $12,000 ÷ 1,000). */
export function RefundScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Scene backdropAnchor={0.5}>
      <h2
        className="m-0 max-w-[1600px] text-8xl font-bold tracking-tight text-ink"
        style={settleStyle(frame, fps, 0.2)}
      >
        {REFUND_HOOK_PRE}
        <div className="text-(--riprap-funds-ink) mt-12">{REFUND_HOOK_POST}</div>
      </h2>
    </Scene>
  );
}
