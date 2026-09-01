---
# riprap-k2e0
title: Codama codegen package @riprap/pool
status: completed
type: task
created_at: 2026-09-01T05:12:51Z
updated_at: 2026-09-01T05:12:51Z
parent: riprap-2eea
blocked_by:
    - riprap-o3sx
---

## Summary of Changes

- `packages/pool` scaffolded as `@riprap/pool` (pnpm workspace member): `codama.json` in CLI-1.x scripts format pointing at `../../target/idl/pool.json`, renderer `@codama/renderers-js` → `generated/`.
- `generated/` committed (27 files): all 6 instructions, 5 events, Pool/Depositor accounts+PDAs, errors, types — entry `generated/src/generated/index.ts`, exported as the package root. Formatted with Biome so regeneration is deterministic via `pnpm codegen` (codama run js + biome write).
- Deps per HANDOFF: `@solana/kit ^7` + `@solana/program-client-core ^7.1.1` (kit 7's own pairing; generated code imports both). Codegen-time devDeps: codama, renderers-js, nodes-from-anchor, typescript, @types/node.
- `build` = `tsc -b` (strict, noEmit, verbatimModuleSyntax) — typechecks committed generated/ only, so `pnpm verify` stays green on fresh checkouts without `anchor build`; codegen stays a separate manual script since `target/idl/` is gitignored.
- Verified: `anchor build` (IDL regenerated), `pnpm verify` exit 0 repo-wide (lint 0 errors — 8 warnings are codama's standard non-null assertions/`{}` types in machine-generated code; 121 tests pass). Unblocks riprap-06s2 (PDA/fetch helpers + vitest).


