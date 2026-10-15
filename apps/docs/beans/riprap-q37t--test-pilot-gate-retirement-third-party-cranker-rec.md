---
# riprap-q37t
title: 'Test pilot-gate retirement: third-party cranker + reconciler matrix'
status: todo
type: task
assigned: tester
priority: high
created_at: 2026-10-15T08:01:18Z
updated_at: 2026-10-15T08:02:04Z
parent: riprap-hxed
blocked_by:
    - riprap-20to
---

Red-green on the retirement change:
- [ ] New LiteSVM test: claim_payout executes with cranker key != mutual.authority (replaces the old rejection test — replaced, not deleted)
- [ ] Reconciler decision matrix: authority column removed; non-authority daemon emits claim_payout for settled mutuals in the pull window
- [ ] Full `pnpm verify` exit 0 (programs change — Rust legs included)
