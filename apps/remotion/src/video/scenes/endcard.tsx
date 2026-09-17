import { Logomark, StampBadge, Wordmark } from "@riprap/ui";
import { useCurrentFrame, useVideoConfig } from "remotion";

import { settleStyle } from "../../shell/anim";
import { END_DATES, END_ECOSYSTEM, END_LINK, END_TAGLINE } from "../copy";
import { Scene } from "../scene";

/** S6 · ENDCARD (f720–900) — the mark, the instance, the one link.
 * StampBadge's own stamp is web-scaled (mono-label 12px) — a static 1.7×
 * stage scale brings it to video size. */
export function EndcardScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Scene backdropAnchor={0.5}>
      <div style={settleStyle(frame, fps, 0.05)} className="flex items-center gap-14">
        <Logomark size={240} />
        <Wordmark size={130} />
      </div>
      <div className="flex flex-cols items-center gap-14" style={settleStyle(frame, fps, 0.3)}>
        <span className="inline-block" style={{ transform: "scale(2)" }}>
          <StampBadge pool="Blade Pool" event="Breakpoint" />
        </span>
      </div>
      <p className="m-0 font-mono text-4xl text-body" style={settleStyle(frame, fps, 0.6)}>
        {END_DATES}
      </p>
      <p className="m-0 text-6xl text-ink" style={settleStyle(frame, fps, 0.85)}>
        {END_TAGLINE}
      </p>
      <p className="m-0 font-mono text-4xl text-body" style={settleStyle(frame, fps, 1.1)}>
        {END_ECOSYSTEM}
      </p>
      <p
        data-num
        className="m-0 font-mono text-7xl font-semibold text-white"
        style={settleStyle(frame, fps, 1.4)}
      >
        {END_LINK}
      </p>
    </Scene>
  );
}
