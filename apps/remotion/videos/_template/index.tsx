import { Sequence } from "remotion";

import { defineVideo } from "../../src/framework/video";
import {
  BRAND_CLOSE_DURATION,
  BRAND_OPEN_DURATION,
  BrandClose,
  BrandOpen,
} from "../../src/shell/brand";
import { Stage } from "../../src/shell/stage";
import { TitleScene } from "./scenes/title";

// per-video copy: the open headline and the closing line are the two
// strings every video customizes (defaults live in src/shell/brand.tsx
// with their provenance; override here or via the components' props).
const HEADLINE = "Your group's got you covered.";

const BODY_DURATION = 60; // replace with this video's actual beats

export const video = defineVideo({
  id: "__SLUG__",
  component: TemplateVideo,
  fps: 30,
  width: 1920,
  height: 1080,
  durationInFrames: BRAND_OPEN_DURATION + BODY_DURATION + BRAND_CLOSE_DURATION,
});

function TemplateVideo() {
  return (
    <Stage>
      {/* every video opens with the brand ink beat (founder default) */}
      <Sequence durationInFrames={BRAND_OPEN_DURATION}>
        <BrandOpen headline={HEADLINE} />
      </Sequence>
      <Sequence from={BRAND_OPEN_DURATION} durationInFrames={BODY_DURATION}>
        <TitleScene subtitle="Replace scenes/ and extend this composition." />
      </Sequence>
      {/* …and closes on the animated lockup (line customizable above) */}
      <Sequence from={BRAND_OPEN_DURATION + BODY_DURATION} durationInFrames={BRAND_CLOSE_DURATION}>
        <BrandClose />
      </Sequence>
    </Stage>
  );
}
