---
# riprap-acat
title: Review def format module
status: completed
type: task
assigned: reviewer
priority: normal
created_at: 2026-10-15T08:01:18Z
updated_at: 2026-10-15T08:02:04Z
parent: riprap-plok
blocked_by:
    - riprap-04yu
---

Review the def-module diff against the milestone HANDOFF data contract:
- [x] Frontmatter fields exactly the §2 contract (no extras, no renames)
- [x] Renderer determinism holds (no clocks, no map-iteration order leaks)
- [x] §-word-maps cover both kinds; no per-pool content in the module
- [x] Changeset present

## Summary of Changes

Review verdict: PASS with one finding fixed.

- §2 contract: TOP/PERIOD/TIER/PROOF/MARKETING key sets match the
  HANDOFF §2 field list exactly (spellings included — `claims_close`,
  `smallestPayout`); unknown keys rejected at every level (tested).
- Determinism: grep confirms no Date/now/random in the module (test file
  excepted); the render path walks input arrays and fixed key orders
  only — no Map/Set iteration feeds output; both vectors' canonical
  bytes are pinned by inline snapshots.
- Word-maps: sections.ts carries both kind title maps; grep finds no
  pool names, prices, or event facts in the module sources (one jsdoc
  example string only).
- Changesets present: riprap-def-v1-format.md, riprap-def-v1-suite.md,
  plus this review's riprap-def-v1-review-hardening.md.

FINDING (fixed): integers beyond Number's safe range broke the format
in both directions — the renderer emitted scientific notation (1e+21)
the grammar cannot parse back, and the parser silently lost precision on
 20-digit integers. Fixed: renderDef guards tier fee/cap + filing fee
  with Number.isSafeInteger; parseScalar rejects unsafe bare integers
  (DefFormatError). Regression test added ("integers beyond the safe
  range are rejected at parse and render").

NOTED (no change): a DefInput carrying `marketing: {}` renders without
  the marketing block and parses back as undefined — input-shape
  asymmetry only, bytes stay canonical and deterministic; the wizard
  never produces the degenerate shape.

Verification: def suite 32/32; scoped gate
`pnpm --filter @riprap/landing run test` 46 files / 438 tests green;
`tsc -b` clean; `pnpm lint` exit 0 (def/ zero diagnostics).
