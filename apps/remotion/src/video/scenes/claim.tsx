import { Card, Claim, Rule } from "@riprap/ui";
import type { ComponentType } from "react";
import { useCurrentFrame, useVideoConfig } from "remotion";

import { settleStyle } from "../../shell/anim";
import { CLAIM_HEADLINE, CLAIM_STEPS } from "../copy";
import { Scene } from "../scene";

const PLATES: { ordinal: string; label: string; Glyph: ComponentType }[] = [
  { ordinal: "03", label: "peers decide", Glyph: Rule },
  { ordinal: "04", label: "a claim is paid", Glyph: Claim },
];

/** S3 · THE CLAIM (f300–480) — drawn members adjudicate; two doors, one opens. */
export function ClaimScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  return (
    <Scene backdropAnchor={0.22}>
      <h2
        className="m-0 text-8xl font-bold tracking-tight text-ink"
        style={settleStyle(frame, fps, 0.1)}
      >
        {CLAIM_HEADLINE}
      </h2>
      <p className="m-0 font-mono text-5xl text-body" style={settleStyle(frame, fps, 0.35)}>
        {CLAIM_STEPS.map((step, i) => (
          <span key={step}>
            {i > 0 && <span className="mx-6 text-muted">→</span>}
            {step}
          </span>
        ))}
      </p>
      <div className="flex gap-12">
        {PLATES.map(({ ordinal, label, Glyph }, i) => (
          <div key={ordinal} className="w-[720px]" style={settleStyle(frame, fps, 0.6 + i * 0.25)}>
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
