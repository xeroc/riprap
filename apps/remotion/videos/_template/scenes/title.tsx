import { Wordmark } from "@riprap/ui";
import { useCurrentFrame, useVideoConfig } from "remotion";

import { settleStyle } from "../../../src/shell/anim";
import { Scene } from "../../../src/shell/scene";

export function TitleScene({ subtitle }: { subtitle?: string }) {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Scene backdropAnchor={0.5}>
      <Wordmark size={130} />
      {subtitle ? (
        <p className="m-0 font-mono text-3xl text-body" style={settleStyle(frame, fps, 0.5)}>
          {subtitle}
        </p>
      ) : null}
    </Scene>
  );
}
