import type { ReactNode } from "react";
import { SvgFrame } from "../atoms/SvgFrame";
import type { MonoSegment } from "../scenes/Panel";
import { MonoLine, Panel, SceneTitle } from "../scenes/Panel";

/**
 * Data-story scaffold (data-stories.md): hook (headline-the-number title) →
 * context (subtitle) → frames (panels on the shared money scale) →
 * resolution. Stories are 1200×675; every number on every frame is
 * doc-sourced, derived (labeled), or an explicit parameter.
 */
export function StoryFrame({
  headline,
  context,
  resolution,
  children,
}: {
  headline: string;
  context: string;
  resolution: MonoSegment[];
  children: ReactNode;
}) {
  return (
    <SvgFrame
      width={1200}
      height={675}
      title={headline}
      desc={`${context}. ${resolution.map((s) => s.text).join("")}`}
    >
      <SceneTitle title={headline} subtitle={context} />
      {children}
      <MonoLine x={40} y={648} size={13} fill="var(--riprap-diagram-muted)" segments={resolution} />
    </SvgFrame>
  );
}

export { Panel };
