# @riprap/remotion — Riprap video compositions

Remotion 4 app rendering `@riprap/ui` kit illustrations. One law above all:
**every animation and illustration in a video is part of (or created in) the
kit** — scenes stage kit components under the kit's `GlyphClockProvider`, so
each rendered frame is a pure function of `frame`/`fps` and the motion is
the kit's own settle curve, byte-for-byte.

```
apps/remotion/
  remotion.config.ts        webpack override: PostCSS (Tailwind v4) before css-loader
  postcss.config.js         @tailwindcss/postcss — must stay .js at package root
  audio/<name>.strudel      the scores (committed) — pasteable into strudel.cc
  public/audio/<name>.wav   baked artifacts (gitignored; regenerate with score)
  src/
    index.ts                registerRoot + theme.css
    Root.tsx                one <Composition> per video
    shell/                  theme.css (Tailwind wiring), stage.tsx (fonts gate),
                            music.tsx (volume fades), anim.ts (settle staging)
    cli/score.ts            strudel → wav baker (offline, needs network once)
    video/                  BladePoolIntro + scenes/ + copy.ts (all strings,
                            every number's provenance cited)
```

## Commands

```bash
pnpm --filter @riprap/remotion studio                          # preview (http://localhost:3000)
pnpm --filter @riprap/remotion score <name> <seconds>          # bake audio/<name>.strudel → wav
pnpm --filter @riprap/remotion render                          # score --stale, then render
pnpm --filter @riprap/remotion build                           # tsc + bundle (part of pnpm verify)
```

This machine has no Remotion-managed Chrome — pass the system browser:

```bash
pnpm --filter @riprap/remotion exec remotion render <id> out/<id>.mp4 --browser-executable /usr/bin/chromium
```

## Video conventions

- 1920×1080@30, muted-first (all copy on-screen), scene boundaries on the
  2s music grid (MUSIC.md; the score's markers quantize to the scene map).
- On-screen copy and numbers live in `src/video/copy.ts` with provenance
  comments — policy §, PROJECT.md, or messaging-guide. Nothing invented;
  unknowns print as `{{PARAM}}`.
- Kit law applies inside videos exactly as on the landing: tokens only (no
  hex), every numeral JetBrains Mono (`data-num`), funds blue = money,
  deliberation = adjudication, peril sparing, zero emoji, settle-not-slide.
- Determinism: no wall-clock motion anywhere — `useCurrentFrame()` only.
