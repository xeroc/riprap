import { Composition } from "remotion";

import { BladePoolIntro } from "./video/BladePoolIntro";

export function RemotionRoot() {
  return (
    <Composition
      id="blade-pool-intro-30s"
      component={BladePoolIntro}
      durationInFrames={34 * 30}
      fps={30}
      width={1920}
      height={1080}
    />
  );
}
