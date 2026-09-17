import { type FC, useMemo } from "react";
import { Html5Audio, interpolate, useVideoConfig } from "remotion";

const CLAMP = { extrapolateLeft: "clamp", extrapolateRight: "clamp" } as const;

export interface MusicDefinition {
  src: string;
  /** base level the fades scale */
  volume?: number;
  /** fade-in seconds from 0 (default none) */
  fadeIn?: number;
  /** fade-out seconds reaching exactly 0 at the composition end (default 1.5) */
  fadeOut?: number;
}

/**
 * Builds the Remotion `volume` callback for a composition's music: base
 * level, optional fade-in from 0, fade-out reaching exactly 0 at the end.
 * Where the legs overlap the quieter one wins. The callback form is what
 * lets Studio draw the volume curve in the timeline.
 */
export function buildMusicVolume(
  music: MusicDefinition,
  { durationInFrames, fps }: { durationInFrames: number; fps: number },
): (frame: number) => number {
  const base = music.volume ?? 1;
  const fadeInFrames = (music.fadeIn ?? 0) * fps;
  const fadeOutFrames = (music.fadeOut ?? 1.5) * fps;
  const fadeOutFrom = durationInFrames - fadeOutFrames;
  return (frame: number) => {
    const legs: number[] = [];
    if (fadeInFrames > 0) {
      legs.push(interpolate(frame, [0, fadeInFrames], [0, 1], CLAMP));
    }
    if (fadeOutFrames > 0) {
      legs.push(interpolate(frame, [fadeOutFrom, durationInFrames], [1, 0], CLAMP));
    }
    return legs.length === 0 ? base : base * Math.min(...legs);
  };
}

/** Mounts the music lane above the composition's own content. */
export const Music: FC<MusicDefinition> = (music) => {
  const { durationInFrames, fps } = useVideoConfig();
  const volume = useMemo(
    () => buildMusicVolume(music, { durationInFrames, fps }),
    [music, durationInFrames, fps],
  );
  return <Html5Audio src={music.src} volume={volume} />;
};
