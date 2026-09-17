# @riprap/remotion — the Riprap video framework

One Remotion 4 framework, many videos. Every video renders `@riprap/ui`
kit illustrations under the kit's glyph clock (deterministic settle
motion — each frame is a pure function of `frame`/`fps`), and lives as a
self-contained directory under `videos/`. Videos are **local-only**: only
`videos/_example` (reference) and `videos/_template` (scaffold) are
tracked — everything else under `videos/` is gitignored.

```
apps/remotion/
  remotion.config.ts        webpack override: PostCSS (Tailwind v4) before css-loader
  postcss.config.js         @tailwindcss/postcss — must stay .js at package root
  audio/<name>.strudel      the scores (committed) — pasteable into strudel.cc
  public/audio/<name>.wav   baked artifacts (gitignored; regenerate with score)
  src/
    index.ts                registerRoot + theme.css import (the entry)
    Root.tsx                one <Folder><Composition/> per video (from manifest)
    videos.gen.ts           GENERATED manifest (gitignored; never hand-edit)
    video-tw-classes.ts     GENERATED Tailwind safelist for videos/ (committed)
    framework/video.ts      defineVideo() — the per-video contract
    framework/music.tsx     music volume curve + Root-mounted <Html5Audio> wrapper
    shell/theme.css         Tailwind wiring, mirroring apps/landing
    shell/stage.tsx         <Stage> — ink canvas + fonts-ready render gate
    shell/scene.tsx         <Scene> — hex paper + glyph clock + column; Kicker/Num
    shell/anim.ts           settleStyle — the kit's settle curve from the clock
    cli/                    `sync` (manifest) + `new` (scaffold) + `score` (audio)
  videos/
    _example/               tracked reference video — read it first
    _template/              scaffold source for `pnpm new <slug>`
    <your-slug>/            your videos — never committed
  public/                   static assets (staticFile("...") targets)
```

## Commands

```bash
pnpm --filter @riprap/remotion new <slug>    # scaffold videos/<slug>/ + regen manifest
pnpm --filter @riprap/remotion studio        # preview all videos (http://localhost:3000)
pnpm --filter @riprap/remotion render <id> out/<id>.mp4
pnpm --filter @riprap/remotion score <name> [seconds]   # bake audio/<name>.strudel → wav
pnpm --filter @riprap/remotion sync          # regenerate src/videos.gen.ts
pnpm --filter @riprap/remotion test          # vitest (framework contract tests)
```

Every command (build/lint/test/studio/render) regenerates the manifest
first, so a freshly created video dir is picked up automatically; studio
and render also chain `score --stale` (re-bakes changed scores, needs
network once — see MUSIC.md).

This machine has no Remotion-managed Chrome; pass the system browser:

```bash
pnpm --filter @riprap/remotion exec remotion render <id> out/<id>.mp4 --browser-executable /usr/bin/chromium
```

## Creating a video

1. `pnpm --filter @riprap/remotion new my-video`
2. Edit `videos/my-video/index.tsx` and add scenes under `videos/my-video/scenes/`.
3. `pnpm --filter @riprap/remotion studio` → pick composition `my-video`.

The contract (see `src/framework/video.ts`):

```tsx
import { staticFile } from "remotion";

import { defineVideo } from "../../src/framework/video";
import { Stage } from "../../src/shell/stage";

export const video = defineVideo({
  id: "my-video",            // letters/numbers/hyphens only (Remotion rule)
  component: MyVideo,        // scenes are <Sequence>s inside, wrapped in <Stage>
  fps: 30,
  width: 1920,
  height: 1080,
  durationInFrames: 30 * 20, // 20s
  music: {                   // optional — mounted + faded by the framework
    src: staticFile("audio/my-score.wav"),
    volume: 0.25,
    fadeOut: 1.5,            // seconds; default 1.5 — hits 0 at the end
  },
});

function MyVideo() {
  return (
    <Stage>
      {/* <Sequence> per scene */}
    </Stage>
  );
}
```

Rules that are enforced by convention — follow them:

- **Import paths:** framework modules are `../../src/...` from
  `videos/<slug>/index.tsx` and `../../../src/...` from
  `videos/<slug>/scenes/*.tsx`.
- **Slug = directory name**, kebab-case. The composition `id` may differ
  (it is what Studio and `render` use).
- Assets: put them in `videos/<slug>/` or `public/` and reference via
  `staticFile()` — never `import` binary media.
- Never commit anything under `videos/` except `_example`/`_template` —
  the `.gitignore` already enforces this.

## Score-driven audio — no audio binaries in the repo

Background music is authored as Strudel code and prebaked to a wav
**build artifact** (gitignored, like `out/`) before rendering. The wav is
strudel's own output, relayed verbatim — mix level, headroom and fades
are authored in the score (`.gain`, `.release`), never post-processed.
The CLI warns when the direct render peaks at full scale (clipping).

Declare the artifact as `music` in `defineVideo` — the framework mounts
it (Root wraps the component, see `src/framework/music.tsx`) and applies
the fades via a `volume` callback, so no video ever renders
`<Html5Audio>` itself and Studio draws the volume curve.

- The score's `setcpm` is parsed by the command; pass the composition
  length in seconds as the second argument (defaults to 30).
- Sync is time-based by construction: score grid (MUSIC.md; e.g. 30 cpm
  → 2s bars) ↔ composition seconds ↔ frames — scene boundaries sit on
  the bar grid.
- Runs entirely in Node (`node-web-audio-api` backs the engine's
  WebAudio calls; no browser involved). Needs network once per render:
  sample manifests load from raw.githubusercontent.com. Silence-guarded —
  a failed render errors loudly instead of producing a muted wav.
- `@strudel/web` is AGPL-3.0: fine for internal build tooling, and the
  wav/mp4 output is your own music — revisit before distributing this
  package's code.

## Obedience to @riprap/ui (non-negotiable)

- **Use the real kit components** — `Wordmark`, `Logomark`, `Card`,
  `Claim`, `Rule`, `TweetCard`, `WorkedExampleReceipt`, `TIERS`, `usd`…
  imported from `@riprap/ui`. No lookalike HTML, no hand-rolled glyphs.
  A kit change re-skins every video on rebuild.
- **Tokens only**: `bg-ground`, `text-ink`, `border-hairline`,
  `text-body`, `bg-card`, `text-(--riprap-funds-ink)`… Never literal hex
  values. Diagram atoms keep their `--riprap-diagram-*` semantics: funds
  blue = money, deliberation = adjudication, peril sparing.
- **Type law in videos too**: every numeral JetBrains Mono (`data-num`,
  or the shell `Num`), uppercase is mono-only (the shell `Kicker`).
- The theme comes from `src/shell/theme.css` (imported by `src/index.ts`),
  which mirrors `apps/landing`'s wiring. Do not import Tailwind or the
  kit stylesheet per-video — it is already wired.
- **Motion law**: settle, not slide — stage scene typography with
  `settleStyle` (`src/shell/anim.ts`), the Remotion twin of the kit's
  settle curve. Kit illustrations animate themselves from the glyph
  clock inside `<Scene>`. No bounce, no overshoot, no oscillating loops.
- **Copy law**: on-screen strings and numbers live in the video's own
  `copy.ts` with provenance comments — policy §, PROJECT.md, or
  messaging-guide. Nothing invented; unknowns print as `{{PARAM}}`.
  Platform-copy surfaces stay numberless (AGENTS.md category vs instance
  law); instance numbers come only from the policy doc.

## Determinism rules

Renders must be reproducible frame-by-frame:

- Animate from `useCurrentFrame()` / `useVideoConfig()` — or let the
  glyph clock drive kit illustrations. Never `setTimeout`, `Date.now`,
  CSS keyframe animations, or wall-clock `motion` components.
- Randomness only via frozen data tables (see `fear.tsx`'s SPOTS) or
  Remotion's `random(seed)`.
- Async (data, fonts, images) only through `delayRender`/`continueRender`
  (the `<Stage>` fonts gate already does this) or in `calculateMetadata`.
- 1920x1080@30 is the default; override per-video in `defineVideo`.
- Muted-first: every message on-screen as text; audio is score, never
  voice.

## How the framework works (maintenance notes)

- **Manifest**: `src/cli/sync.ts` scans `videos/*/` for `index.ts(x)`,
  validates names, and writes `src/videos.gen.ts` with static imports
  (Remotion's bundler cannot discover directories at runtime). The file
  is gitignored; CI regenerates it from the tracked dirs alone. Deleting
  it is safe — any script command recreates it.
- **Tailwind for local videos**: the videos/ tree is gitignored, so
  Tailwind v4 auto source detection never scans it. Two safeguards:
  the `@source "../../videos/*"` glob in `src/shell/theme.css` (the
  one-level glob is load-bearing — see its comment) and the generated
  `src/video-tw-classes.ts` safelist under src/, which IS scanned.
- **Tailwind via PostCSS**: Remotion's webpack CSS chain is style-loader
  → css-loader with **no PostCSS stage**. `remotion.config.ts` therefore
  appends `postcss-loader` to the CSS rule (loader order is right-to-
  left: appended = runs first). `postcss.config.js` must stay a `.js`
  file at the package root — `.mjs` is not discovered, and the config
  silently not applying yields transparent/black frames.
- **Fonts**: Fontsource CSS from the ui kit loads async in headless
  Chrome; `<Stage>` gates the first frame on `document.fonts.ready`.
- **Music**: `defineVideo({ music })` is the whole contract — Root wraps
  the component with `withMusic` (`src/framework/music.tsx`), so videos
  never render `<Html5Audio>` themselves.
- **Bundle output** is `build/` (gitignored).

## Tests

`pnpm --filter @riprap/remotion test` — vitest + jsdom:

- `src/cli/sync.test.ts` — manifest scanning/rendering contract,
  including the Tailwind safelist collector.
- `src/framework/music.test.ts` — volume curve legs + defineVideo
  music validation.

Both are framework contract tests; individual videos do not carry tests.
