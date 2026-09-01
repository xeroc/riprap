---
# riprap-7b4e
title: CLI suite hardening + README + verify wiring
status: todo
type: task
tags:
    - ts
    - cli
created_at: 2026-09-01T23:29:35Z
updated_at: 2026-09-01T23:29:35Z
parent: riprap-pobu
blocked_by:
    - riprap-oi81
    - riprap-djgb
---

Close the CLI epic:
- Every command file carries examples + summary (help completeness pass; oclif scan warnings = failure — stale/moved command files confuse the scan, accord README notes this).
- Optional Surfpool smoke: one happy pool:init -> deposit -> spend --dry-run chain against a live validator when reachable, skip cleanly otherwise (accord env.up pattern) — the deep flows already have e2e in @riprap/tests; this lane is CLI-only wiring proof.
- README.md: run instructions (bun dev / dist), config table (flags/env/defaults incl. RIPRAP_* names), command index per topic, single-signer model + claim-payout co-signer exception.
- pnpm verify green end to end with the new apps/cli lanes (build, biome, vitest).

Checklist:
- [ ] help completeness + smoke green
- [ ] README + verify green
