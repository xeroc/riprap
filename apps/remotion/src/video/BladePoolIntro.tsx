import { Sequence, staticFile } from "remotion";

import { Music } from "../shell/music";
import { Stage } from "../shell/stage";
import { ClaimScene } from "./scenes/claim";
import { EndcardScene } from "./scenes/endcard";
import { FearScene } from "./scenes/fear";
import { HookScene } from "./scenes/hook";
import { JoinScene } from "./scenes/join";
import { RefundScene } from "./scenes/refund";
import { SettleScene } from "./scenes/settle";

/**
 * blade-pool-intro-30s — 34s muted-first X/Twitter intro for
 * Riprap: Blade Pool @ Breakpoint 2026. 16:9 1920×1080, kit illustrations
 * under the glyph clock, settle motion throughout. Scene map (bar-quantized,
 * 1 bar = 2s = 60 frames):
 *   S0 fear     f0–120   the timeline's evidence — bunjil center, quotes hammer in.
 *   S1 hook     f120–240 pilot kicker, $20 what-if, peril named plainly.
 *   S2 join     f240–420 chip in — tiers (policy §5), 1,000 × $20 → $20,000.
 *   S3 claim    f420–600 file → drawn members → ruling; rejected branch drawn.
 *   S4 settle   f600–720 4 approved claims paid; ledger (policy §10); $12,000 remains.
 *   S5 refund  f720–840 what's left is refunded — $12 to every member.
 *   S6 endcard  f840–1020 mark, instance stamp, tagline, riprap.xyz.
 */
export function BladePoolIntro() {
  return (
    <Stage>
      <Music src={staticFile("audio/blade-pool-intro-30s.wav")} volume={0.25} fadeOut={1.5} />
      <Sequence durationInFrames={120}>
        <FearScene />
      </Sequence>
      <Sequence from={121} durationInFrames={119}>
        <HookScene />
      </Sequence>
      <Sequence from={240} durationInFrames={180}>
        <JoinScene />
      </Sequence>
      <Sequence from={420} durationInFrames={180}>
        <ClaimScene />
      </Sequence>
      <Sequence from={600} durationInFrames={120}>
        <SettleScene />
      </Sequence>
      <Sequence from={720} durationInFrames={120}>
        <RefundScene />
      </Sequence>
      <Sequence from={840} durationInFrames={180}>
        <EndcardScene />
      </Sequence>
    </Stage>
  );
}
