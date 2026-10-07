# AGENTS.md — @riprap/remotion

Instructions for coding agents working in this package. Supplements the
root `AGENTS.md`; where they disagree, the root file wins.

## No tests for videos — ever

**Founder directive (2026-10-07): never build tests for the videos.** No
vitest files, no render assertions, no snapshot suites — nothing under
`videos/`, and no test scaffolding for this package at all. This package
carried `src/cli/sync.test.ts` + `src/framework/music.test.ts` until the
directive; both were deleted with it and the `test` script removed from
`package.json`. Do not reintroduce them.

Verification for video work is visual + measurement, not unit tests:
per-shot stills (`remotion still`), pixel probes for token/semantic
colors, render-back beat verification when the film is beat-synced (see
`videos/<slug>/scripts/verify-sync.py` in videos that ship one), and the
independent final review. The completion gate for this package is
`build + lint` (tsc + biome via the package scripts); `pnpm -r run test`
skips packages without a `test` script, which is by design here.

## Everything else

Follow the root `AGENTS.md` and `README.md` in this directory: the
`defineVideo` contract, kit obedience (`@riprap/ui` components and tokens
only), determinism rules, copy provenance law (`copy.ts`), and the
local-only `videos/` tree. The audio law (licensing, loudness, dual
bakes) lives in `README.md` § Audio.
