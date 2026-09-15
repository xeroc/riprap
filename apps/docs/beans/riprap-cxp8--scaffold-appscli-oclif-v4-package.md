---
# riprap-cxp8
title: Scaffold apps/cli oclif v4 package
status: completed
type: task
tags:
    - ts
    - cli
created_at: 2026-09-01T23:29:10Z
updated_at: 2026-09-01T23:29:10Z
parent: riprap-pobu
---

oclif-scaffolder structure as realized in @useaccord/cli (v4, not the v3 template):
- apps/cli/package.json: @riprap/cli, type module, bin { riprap: ./bin/run.js }; oclif block: bin riprap, topicSeparator ":", commands ./dist/commands, plugins [@oclif/plugin-help], topic descriptions for config / pool / hanse; scripts build (tsc --noEmit && tsup), dev/start (bun bin/dev.js|run.js), lint (biome), test (vitest run); deps @oclif/core ^4, @oclif/plugin-help, @solana/kit, workspace @riprap/pool + @riprap/hanse.
- bin/dev.js + bin/run.js (accord pattern: dev loads TS via bun, run loads dist), tsup.config.ts, tsconfig, .gitignore.
- src/commands/config placeholder? NO — no stubs; scaffold ships empty command tree but builds, `riprap --help` works via plugin-help with the three topics declared.
- pnpm-workspace already covers apps/*; pnpm -r build + biome + vitest lanes green.

Checklist:
- [x] package builds; help renders topics
- [x] repo lanes (biome, vitest) wired

## Summary of Changes

- Scaffolded `apps/cli` (`@riprap/cli`, bin `riprap`) on the @useaccord/cli pattern: `bin/dev.js` (bun, `development: true`) + `bin/run.js` (dist), `tsup.config.ts` (per-command ESM chunks from `src/commands`, SDK inlined, registry deps external), self-contained strict tsconfig, `.gitignore`.
- `package.json` oclif block: `topicSeparator ":"`, `commands ./dist/commands`, plugin-help, topic descriptions for config / pool / hanse. Empty command tree, no stubs; `src/commands/.gitkeep` only.
- Added one smoke test `src/help.test.ts` (4 tests): `--help` exits 0 with usage; each declared topic page (`riprap config|pool|hanse --help`) renders its description and exits 0. Note: oclif v4 only lists topics with children in the top-level help, so the three topics appear there automatically as sibling beans land commands — verified topic pages render via package.json declarations instead.
- Deviation: `@riprap/hanse` workspace dep omitted — the package does not exist in this workspace yet (hanse milestone still in flight; `packages/hanse` absent) and an unresolvable `workspace:*` dep hard-fails `pnpm install`. The hanse CLI beans (riprap-djgb / riprap-izow) add the one-line dep when hanse lands via cross-epic refresh; tsup `external` already lists it.
- tsup placeholder: with zero commands, esbuild requires an entry, so the scaffold bundles `bin/run.js` as `dist/.scaffold-placeholder.js`; disappears once the first command lands.
- `pnpm verify` green end-to-end (build, biome zero errors — remaining warnings pre-exist in generated/ui code, vitest, anchor build, cargo test). `pnpm-lock.yaml` updated.
