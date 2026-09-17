import { Sequence } from "remotion";

import { defineVideo } from "../../src/framework/video";
import { Stage } from "../../src/shell/stage";
import { GlyphsScene } from "./scenes/glyphs";
import { TitleScene } from "./scenes/title";

const FPS = 30;

/**
 * _example — the tracked reference video. Demonstrates the framework
 * basics: Stage (fonts gate), Scene (glyph clock + hex paper), settle
 * staging, kit components (Logomark, Wordmark, Card, glyphs), and
 * Sequence scene cuts.
 */
export const video = defineVideo({
  id: "example",
  component: ExampleVideo,
  fps: FPS,
  width: 1920,
  height: 1080,
  durationInFrames: 10 * FPS,
});

function ExampleVideo() {
  return (
    <Stage>
      <Sequence durationInFrames={5 * FPS}>
        <TitleScene />
      </Sequence>
      <Sequence from={5 * FPS} durationInFrames={5 * FPS}>
        <GlyphsScene />
      </Sequence>
    </Stage>
  );
}
