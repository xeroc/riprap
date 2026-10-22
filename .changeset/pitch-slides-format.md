---
"@riprap/demo-worlds-fair": patch
"@riprap/angel-round": patch
"@riprap/landing": patch
---

Two release-pipeline repairs. Format the two decks' slides.tsx with Biome —
the 2026-10-22 slide re-stage landed unformatted and failed the lint leg.
Raise testing-library's asyncUtilTimeout to 5s in the landing test setup —
findBy* waits run on their own 1s clock (not vitest's 20s testTimeout), and
loaded CI runners missed that budget twice today (CreatePage, BreakpointPage
ready-state texts), each a different "text not found" flake.
