import { Logomark, Wordmark } from "@riprap/ui";
import { useCurrentFrame, useVideoConfig } from "remotion";

import { settleStyle } from "../../../src/shell/anim";
import { Kicker, Scene } from "../../../src/shell/scene";

/** reference title — the mark and wordmark settle in on the hex paper. */
export function TitleScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Scene backdropAnchor={0.5}>
      <Kicker>riprap — reference video</Kicker>
      <div className="flex items-center gap-14" style={settleStyle(frame, fps, 0.2)}>
        <Logomark size={200} />
        <Wordmark size={130} />
      </div>
    </Scene>
  );
}
