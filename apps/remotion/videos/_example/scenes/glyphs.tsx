import { Card, Claim, Rule } from "@riprap/ui";
import type { ComponentType } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

import { settleStyle } from "../../../src/shell/anim";
import { Scene } from "../../../src/shell/scene";

/** reference scene — kit glyphs animate under the glyph clock inside Cards. */
const PLATES: { ordinal: string; label: string; Glyph: ComponentType }[] = [
  { ordinal: "01", label: "peers decide", Glyph: Rule },
  { ordinal: "02", label: "a claim is paid", Glyph: Claim },
];

export function GlyphsScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Scene backdropAnchor={0.22}>
      <div className="flex gap-12">
        {PLATES.map(({ ordinal, label, Glyph }, i) => (
          <div key={ordinal} className="w-[720px]" style={settleStyle(frame, fps, 0.2 + i * 0.25)}>
            <Card className="flex h-full flex-col items-center gap-10 p-12">
              <div className="w-[420px]">
                <Glyph />
              </div>
              <p className="m-0 flex items-baseline gap-4">
                <span data-num className="font-mono text-3xl text-white/40">
                  {ordinal}
                </span>
                <span className="font-mono text-3xl uppercase tracking-(--riprap-tracking-stamp) text-body">
                  {label}
                </span>
              </p>
            </Card>
          </div>
        ))}
      </div>
    </Scene>
  );
}
