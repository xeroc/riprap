---
# riprap-0yfb
title: Regenerate @riprap/pool SDK with burn
status: todo
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
- [ ] SDK regenerated, tests green, workspace build green
