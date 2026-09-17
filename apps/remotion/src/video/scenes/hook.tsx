import { useCurrentFrame, useVideoConfig } from "remotion";
import { settleStyle } from "../../shell/anim";
import {
  HOOK_HEADLINE_LINE2,
  HOOK_HEADLINE_LINE3,
  HOOK_HEADLINE_NUM,
  HOOK_HEADLINE_POST,
  HOOK_HEADLINE_PRE,
  HOOK_KICKER,
  HOOK_SUB,
} from "../copy";
import { Kicker, Num, Scene } from "../scene";
/** S1 · HOOK (f0–120) — the pilot, the price, the peril, plainly.
 * Three beats at display size: the offer, the cover, the event. */
export function HookScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Scene>
      <div style={settleStyle(frame, fps, 0.1)}>
        <Kicker>{HOOK_KICKER}</Kicker>
      </div>
      <h1 className="m-0 text-9xl leading-[1.04] font-bold tracking-tight text-ink">
        <span className="block" style={settleStyle(frame, fps, 0.3)}>
          {HOOK_HEADLINE_PRE} <Num funds>{HOOK_HEADLINE_NUM}</Num> {HOOK_HEADLINE_POST}
        </span>
        <span className="block" style={settleStyle(frame, fps, 0.5)}>
          {HOOK_HEADLINE_LINE2}
        </span>
        <span className="block" style={settleStyle(frame, fps, 0.7)}>
          {HOOK_HEADLINE_LINE3}
        </span>
      </h1>
      <p
        className="m-0 max-w-[1600px] font-mono text-3xl leading-relaxed text-body"
        style={settleStyle(frame, fps, 1.1)}
      >
        {HOOK_SUB}
      </p>
    </Scene>
  );
}
