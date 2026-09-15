---
# riprap-0yfb
title: Regenerate @riprap/pool SDK with burn
status: completed
type: task
tags:
    - ts
created_at: 2026-09-01T23:29:10Z
updated_at: 2026-09-01T23:29:10Z
parent: riprap-rvk8
blocked_by:
    - riprap-609b
---

GAP found during CLI planning: riprap-609b adds pool::burn but nothing refreshes the generated client.
- anchor build (new IDL with burn) -> packages/pool codegen (codama run js + biome) -> generated client carries burn instruction builders + accounts unchanged elsewhere.
- vitest suites in packages/pool stay green; @riprap/pool consumers (apps/landing) unaffected (tsc -r build proves it).

Checklist:
- [x] SDK regenerated, tests green, workspace build green

## Summary of Changes

- No new code needed: the AGENTS completion-gate rule (program change -> `pnpm --filter @riprap/pool codegen` in the same commit) already landed the regeneration inside the riprap-609b change `ba358a54`.
- Verified now: generated client carries `instructions/burn.ts` + `events/burned.ts` with only index/program registrations touched elsewhere (nothing else changed); `pnpm --filter @riprap/pool test` — 2 files, 9 tests passed; `pnpm -r run build` exit 0 (apps/landing consumer unaffected).
