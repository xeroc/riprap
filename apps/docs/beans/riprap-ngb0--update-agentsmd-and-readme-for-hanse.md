---
# riprap-ngb0
title: Update AGENTS.md and README for hanse
status: todo
type: task
priority: normal
tags:
    - docs
created_at: 2026-09-01T17:40:03Z
updated_at: 2026-09-01T23:29:35Z
parent: riprap-6vc7
blocked_by:
    - riprap-c448
    - riprap-6ph7
    - riprap-7b4e
---

Repo docs kept truthful (docs or same-commit as final wiring, never silently stale):
- AGENTS.md: overview += programs/hanse + @riprap/hanse + @riprap/tests; completion gate note (jest e2e lane, offline skip); test prerequisites: sibling accord checkout built (ACCORD_SO) + the accord git rev pin documented.
- README workspace map.
- Confirm pnpm verify text matches what verify actually runs.

Checklist:
- [ ] docs updated
- [ ] pnpm verify green end-to-end

Also cover apps/cli (@riprap/cli): workspace map entry, config env names (RIPRAP_*), single-signer + claim-payout co-signer note.
