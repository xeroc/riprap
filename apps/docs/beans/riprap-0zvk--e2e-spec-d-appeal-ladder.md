---
# riprap-0zvk
title: 'e2e spec d: appeal ladder'
status: todo
type: task
tags:
    - ts
    - e2e
created_at: 2026-09-01T17:40:03Z
updated_at: 2026-09-01T17:40:03Z
parent: riprap-oaa8
blocked_by:
    - riprap-e5t9
---

EVENT-MUTUAL §7 + accord appeal: round resolved -> appeal (appellant posts new-round fee + bond) -> 7-panel redraw -> commit/reveal -> finalize. settle_claim reads the FINAL ruling; prior-round economics settle via settle_round crank; appeal bond refunded when flipped, forfeited when not — assert the correct branch. Juror count sufficient for the larger panel (stake enough distinct members).

Checklist:
- [ ] spec green incl. settle_round + bond branch
