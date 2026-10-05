---
"@riprap/remotion": minor
---

Add the shared brand beats to the video framework: `BrandOpen` (ink crosshair, ring assembly, wordmark letterpress, kicker typewriter, 1s lockup hold) and `BrandClose` (animated lockup + closing line + riprap.xyz, 1s hold) in `src/shell/brand.tsx`, with duration/hold constants under test. Every new scaffold (`pnpm new <slug>`) now opens and closes on them; the open headline and closing line are per-video props. Default closing line is "Mutuals as an open protocol." (founder directive 2026-10-05).
