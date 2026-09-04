---
# riprap-dw6d
title: Scaffold @riprap/hanse Codama client
status: completed
type: task
tags:
    - ts
created_at: 2026-09-01T17:39:46Z
updated_at: 2026-09-01T17:39:46Z
parent: riprap-bkxy
blocked_by:
    - riprap-pow4
---

Mirror packages/pool exactly:
- packages/hanse/package.json: @riprap/hanse, private, type module, exports ./src/index.ts; deps @solana/kit + @solana/program-client-core; scripts riprap/codegen/build(tsc -b)/lint(biome)/test(vitest) matching pool; codama devDeps.
- codama.json against the hanse IDL (target/idl/hanse.json after anchor build); run codegen; biome check --write generated.
- src/index.ts re-exporting the generated client (helpers come in the next bean).
- pnpm -r build green; requires anchor build first (IDL must exist).

## Summary of Changes

- `packages/hanse` scaffolded as `@riprap/hanse` (pnpm workspace member), mirroring `packages/pool`: `codama.json` → `../../target/idl/hanse.json`, renderer `@codama/renderers-js` → `generated/`, same strict noEmit `tsc -b` tsconfig.
- `generated/` committed (49 files, Biome-formatted for deterministic regen): 8 instructions (initializeMutual…dissolve), 8 events, Mutual/Member/Claim accounts + PDAs (memberAccount, claim, ownership/rights authorities), errors, accord Dispute/CaseTerms types. `src/index.ts` re-exports the generated client only — helpers come in riprap-vrqz.
- One deliberate deviation from pool's scripts: `test` = `vitest run --passWithNoTests` (bare `vitest run` exits 1 with zero test files and would break root `pnpm test` until riprap-vrqz adds tests; flag can drop then).
- Cold-target note: `anchor build`'s IDL pass compiles hanse's tests, which `include_bytes!("target/deploy/pool.so")` before anchor produces it → deterministic failure on a fresh target. Worked around by building pool with `cargo +1.89.0-sbpf-solana-v1.52 build --release --target sbpf-solana-solana -p pool` and staging `target/deploy/pool.so` first. Drafted as a follow-up bean.
- Verified: `anchor build` exit 0 (IDL emitted), codegen green, `pnpm -r run build` exit 0, `pnpm lint` 0 errors (23 warnings = codama's standard non-null assertions/`{}` types in generated code), `pnpm test` exit 0 (pool 9, ui 101, landing 20).

Checklist:
- [x] package + codegen committed
- [x] tsc -b green
