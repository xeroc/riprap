# @riprap/remotion

## 0.7.0

### Patch Changes

- [#9](https://github.com/xeroc/riprap/pull/9) [`c603c8f`](https://github.com/xeroc/riprap/commit/c603c8f8ca7ead128c76cc3e78519c3ea029d1db) Thanks [@xeroc](https://github.com/xeroc)! - Removed the remotion package's test lane by founder directive: deleted `src/cli/sync.test.ts` + `src/framework/music.test.ts` + `vitest.config.ts`, dropped the `test` script from `package.json`, and added `apps/remotion/AGENTS.md` codifying the rule — never build tests for the videos; verification is stills, pixel probes, render-back beat checks, and independent review. Root `AGENTS.md` Parts table now carries the Videos row with the no-test-lane note.
  
  `vitest` + `jsdom` stay in `package.json` for now (orphaned by this change): the lockfile is mid-flight with the cranker `@useaccord/sdk@0.5.1` pin — sweep both deps in the same lockfile-updating change when that lands.

- [#9](https://github.com/xeroc/riprap/pull/9) [`fa037c8`](https://github.com/xeroc/riprap/commit/fa037c8d079cacca0f96472abe58a4db0bd2f540) Thanks [@xeroc](https://github.com/xeroc)! - Removed the Strudel-scoring guidance from the README and deleted MUSIC.md — audio authoring is no longer steered toward Strudel. The score CLI, the committed audio/*.strudel files, and the studio/render stale-rebake chain are unchanged and keep working; music remains any wav under public/audio/ mounted via defineVideo.
- Updated dependencies []:
  - @riprap/ui@0.7.0

## 0.6.0

### Minor Changes

- [#7](https://github.com/xeroc/riprap/pull/7) [`2675dd2`](https://github.com/xeroc/riprap/commit/2675dd22d214ee63cadc8d7e2f08835f98e45b80) Thanks [@xeroc](https://github.com/xeroc)! - Add the shared brand beats to the video framework: `BrandOpen` (ink crosshair, ring assembly, wordmark letterpress, kicker typewriter, 1s lockup hold) and `BrandClose` (animated lockup + closing line + riprap.xyz, 1s hold) in `src/shell/brand.tsx`, with duration/hold constants under test. Every new scaffold (`pnpm new <slug>`) now opens and closes on them; the open headline and closing line are per-video props. Default closing line is "Mutuals as an open protocol." (founder directive 2026-10-05).

### Patch Changes

- [#7](https://github.com/xeroc/riprap/pull/7) [`c4dbada`](https://github.com/xeroc/riprap/commit/c4dbada512a3c9aa75d351684f503ee772f5b3a7) Thanks [@xeroc](https://github.com/xeroc)! - Breakpoint 2026 intro video: background music is the found track "Meditation" by Arulo (Mixkit License, free commercial, no attribution required — source and license recorded in the video dir's AUDIO-SOURCE.md), mounted as a gitignored wav under `public/audio/`, plus the Breakpoint lockup assets under `public/breakpoint-assets/` (the same nav SVG pair the landing's event chip uses). The video itself renders from the local `videos/breakpoint-intro/` dir per the framework's gitignore convention.

- [#7](https://github.com/xeroc/riprap/pull/7) [`5ab73f3`](https://github.com/xeroc/riprap/commit/5ab73f37600870b93294dcf5517b9d463cd29f95) Thanks [@xeroc](https://github.com/xeroc)! - Open the audio path in the video framework: music is any wav under `public/audio/` mounted via `defineVideo` — Strudel scoring is now an optional authoring path (README § Audio rewritten, MUSIC.md reframed as optional house style) with licensing and loudness made part of done. AGENTS.md repo map updated to match.
- Updated dependencies [[`61606e8`](https://github.com/xeroc/riprap/commit/61606e8e6d3cdfc2d43497787b5208c884df98aa)]:
  - @riprap/ui@0.6.0

## 0.5.0

### Minor Changes

- [#5](https://github.com/xeroc/riprap/pull/5) [`3918a8f`](https://github.com/xeroc/riprap/commit/3918a8f7c17637dfa0668461dddb896f91596c25) Thanks [@xeroc](https://github.com/xeroc)! - Relocated the blade-pool-intro video from src/video/ into videos/blade-pool-intro/ under the defineVideo contract (it now registers in the generated manifest like every other video; music is declared, not self-rendered), and added a new 10s launch video, videos/blade-pool-launch/ — the tweet wall, the $20 what-if held three seconds, then the endcard with a harbor-blue LIVE / on Solana stamp slamming over the mark. Score: audio/blade-pool-launch.strudel (riprap family, 5 bars).

### Patch Changes

- Updated dependencies []:
  - @riprap/ui@0.5.0

## 0.4.0

### Patch Changes

- Updated dependencies [[`7c87153`](https://github.com/xeroc/riprap/commit/7c871532a60f81ef1881c2d257ddd773b5d61026)]:
  - @riprap/ui@0.4.0

## 0.3.0

### Patch Changes

- Updated dependencies []:
  - @riprap/ui@0.3.0

## 0.2.0

### Minor Changes

- initial changeset release

### Patch Changes

- Updated dependencies [`a9f65eb`]:
  - @riprap/ui@0.2.0
