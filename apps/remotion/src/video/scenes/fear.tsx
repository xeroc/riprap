import { settleAt, TweetCard } from "@riprap/ui";
import { staticFile, useCurrentFrame, useVideoConfig } from "remotion";

import { Scene } from "../scene";
import { CENTER_TWEET, HAMMER_TWEETS } from "../tweets";

/** one hammered card's landing spot — seeded scatter (mulberry32, 2026-09-17),
 * tuned for poster-size cards (×2.5), frozen as data so every frame renders
 * identically */
const SPOTS: { x: number; y: number; rot: number }[] = [
  { x: 1308, y: 564, rot: -10.1 },
  { x: 1546, y: 748, rot: -3.9 },
  { x: 1515, y: 860, rot: 8.6 },
  { x: 965, y: 838, rot: -4.5 },
  { x: 885, y: 860, rot: 9.4 },
  { x: 421, y: 860, rot: -0.3 },
  { x: 549, y: 625, rot: 3.4 },
  { x: 364, y: 477, rot: -11.8 },
  { x: 360, y: 240, rot: 10.3 },
  { x: 653, y: 358, rot: 8.2 },
  { x: 841, y: 240, rot: -8.5 },
  { x: 1243, y: 240, rot: 4.8 },
  { x: 1174, y: 262, rot: -6.6 },
  { x: 1424, y: 312, rot: -9.8 },
];

/** poster scale — the quotes must read at video size (2.2× the web card) */
const SCALE = 2.2;

/** card width is fixed per quote length — wider quote, wider card, so the
 * card holds ~2–3 lines and lands in a 2:1..3:1 width:height band */
const CARD_WIDTHS = ["w-[304px]", "w-[352px]", "w-[400px]"] as const;
const widthFor = (text: string, maxChars: number) => {
  const n = Math.min(text.length, maxChars);
  return CARD_WIDTHS[n <= 60 ? 0 : n <= 100 ? 1 : 2];
};

/** first hammer lands at 1.0s, one every 165ms — percussive, all down by ~3.3s */
const CENTER_DELAY = 0.2;
const HAMMER_START = 1.0;
const HAMMER_STEP = 0.165;

/** S0 · FEAR (f0–120) — the timeline's evidence: bunjil's tweet settles dead
 * center, then the rest hammer in around it, each into its own rotated pose,
 * like quotes pinned over the board. Quotes are verbatim (tweets.ts); the
 * arrival is the kit's settle law (settleAt, 160ms ease-out), rotation is a
 * static final pose — nothing spins, nothing bounces. */
export function FearScene() {
  const frame = useCurrentFrame();
  const { fps } = useVideoConfig();
  const t = frame / fps;

  return (
    <Scene backdropAnchor={0.5}>
      <div className="absolute inset-0">
        {(
          [
            { tweet: CENTER_TWEET, x: "50%", y: "52%", rot: 0, delay: CENTER_DELAY, wide: true },
            ...HAMMER_TWEETS.map((tweet, i) => ({
              tweet,
              x: `${SPOTS[i % SPOTS.length].x}px`,
              y: `${SPOTS[i % SPOTS.length].y}px`,
              rot: SPOTS[i % SPOTS.length].rot,
              delay: HAMMER_START + i * HAMMER_STEP,
              wide: false,
            })),
          ] as const
        ).map(({ tweet, x, y, rot, delay, wide }) => {
          const p = settleAt(t, delay);
          const maxChars = wide ? 140 : 100;
          return (
            <div
              key={String(delay)} // unique per card: arrival slot
              data-arrived={p > 0}
              className="absolute"
              style={{
                left: x,
                top: y,
                opacity: p,
                transform: `translate(-50%, -50%) translateY(${(1 - p) * -16}px) rotate(${rot}deg) scale(${SCALE})`,
              }}
            >
              <TweetCard
                author={tweet.author}
                handle={tweet.handle}
                text={tweet.text}
                date={tweet.date}
                href={tweet.url}
                avatar={tweet.avatar ? staticFile(tweet.avatar) : undefined}
                maxChars={maxChars}
                className={widthFor(tweet.text, maxChars)}
              />
            </div>
          );
        })}
      </div>
    </Scene>
  );
}
