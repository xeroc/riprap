import { WorkedExampleReceipt } from "@riprap/ui";
import { useCurrentFrame, useVideoConfig } from "remotion";

import { settleStyle } from "../../shell/anim";
import {
  SETTLE_HEADLINE_POST,
  SETTLE_HEADLINE_PRE,
  SETTLE_SUB,
  WORKED_LABEL,
  WORKED_LINES,
  WORKED_TOTAL,
} from "../copy";
import { Num, Scene } from "../scene";

/** S4 · SETTLEMENT (f600–720) — the worked example, one line at a time:
 * 4 approved claims paid, $12,000 remains. The claim count rides under
 * the headline; the receipt carries the math (policy §10).
 *
 * The kit receipt's own type is web-scaled; SLIP_SCALE brings it to video
 * size. The slip is OPAQUE (bg-card) and paint order follows DOM order, so
 * the wrapper RESERVES the full scaled height (unscaled ~354px × 1.75 ≈
 * 620px) — the visual body must never paint past the reserved box. */
const SLIP_SCALE = 1.75;
const SLIP_VISUAL_H = 620; // ≈ receipt box 354px × SLIP_SCALE

export function SettleScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Scene backdropAnchor={0.5}>
      <h2
        className="m-0 text-8xl font-bold tracking-tight text-ink"
        style={settleStyle(frame, fps, 0.1)}
      >
        <Num funds>{SETTLE_HEADLINE_PRE}</Num> {SETTLE_HEADLINE_POST}
      </h2>
      <p className="m-0 font-mono text-4xl text-body" style={settleStyle(frame, fps, 0.25)}>
        {SETTLE_SUB}
      </p>
      <div className="my-2" style={{ height: SLIP_VISUAL_H, ...settleStyle(frame, fps, 0.4) }}>
        <div style={{ transform: `scale(${SLIP_SCALE})`, transformOrigin: "top center" }}>
          <WorkedExampleReceipt
            lines={WORKED_LINES}
            total={WORKED_TOTAL}
            label={WORKED_LABEL}
            staggerMs={300}
          />
        </div>
      </div>
    </Scene>
  );
}
