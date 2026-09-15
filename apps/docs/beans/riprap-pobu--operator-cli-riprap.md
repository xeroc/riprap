---
# riprap-pobu
title: Operator CLI (riprap)
status: completed
type: epic
priority: normal
created_at: 2026-09-01T23:29:10Z
updated_at: 2026-09-15T10:22:07Z
parent: riprap-dw8b
---

apps/cli (@riprap/cli, bin: riprap) — oclif v4 operator CLI for pool + hanse, architecture lifted from the proven @useaccord/cli (oclif v4, ESM, bun-first dev via bin/dev.js, tsup dist, topic dirs, BaseCommand/ChainCommand). Topics: config (shared), pool:*, hanse:* — nested so the two programs stay clearly distinguished. Thin-wrapper law: every command delegates to @riprap/pool / @riprap/hanse SDKs; NO protocol logic in the CLI. Repo conventions override accord ones where they collide: Biome lint (not eslint/prettier), vitest (not bun test/mocha).
