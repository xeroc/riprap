---
# riprap-04yu
title: 'Test def format: determinism, worked vectors, validation matrix, round-trip'
status: todo
type: task
assigned: tester
priority: normal
created_at: 2026-10-15T08:01:18Z
updated_at: 2026-10-15T08:02:04Z
parent: riprap-plok
blocked_by:
    - riprap-i6c3
---

Colocated vitest suite for the def module (see milestone riprap-9bh4 HANDOFF §6, first two rows):
- [ ] Determinism: same DefInput renders byte-identical twice
- [ ] Worked vectors: Chairmageddon (mutual) + Caffeine Supercycle (bounty) rendered from existing doc facts; §5 tier tables verbatim; byte snapshots
- [ ] Validation matrix: every rejection path (tiers, period, slot grammar, unknown keys, kind enum, slug)
- [ ] Round-trip: renderer output parses back through sections.ts
- [ ] Scoped gate green: pnpm --filter @riprap/landing run test
