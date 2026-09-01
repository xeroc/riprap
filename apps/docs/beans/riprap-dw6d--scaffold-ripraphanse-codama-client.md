---
# riprap-dw6d
title: Scaffold @riprap/hanse Codama client
status: todo
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

Checklist:
- [ ] package + codegen committed
- [ ] tsc -b green
