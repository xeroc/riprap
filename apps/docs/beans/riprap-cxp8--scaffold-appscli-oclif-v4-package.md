---
# riprap-cxp8
title: Scaffold apps/cli oclif v4 package
status: todo
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
- [ ] package builds; help renders topics
- [ ] repo lanes (biome, vitest) wired
