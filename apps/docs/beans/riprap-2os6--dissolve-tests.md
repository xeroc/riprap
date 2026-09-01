---
# riprap-2os6
title: dissolve + tests
status: todo
type: task
tags:
    - rust
    - tdd
created_at: 2026-09-01T17:39:27Z
updated_at: 2026-09-01T17:39:27Z
parent: riprap-ggsd
blocked_by:
    - riprap-6zfr
---

EVENT-MUTUAL §7. Permissionless crank.
Gates: phase Settled, now >= pull_close_at.
CPI pool::liquidate via [mutual_own, mutual] (ownership authority). phase = Dissolved. Unpulled approved amounts stay in the treasury -> residual; members exit via pool crank directly — NO mutual wrapper (spec §7).

Tests: happy (pool Liquidated, liquidation_balance snapshot set), early dissolve reverts (warp before pull_close_at), double dissolve reverts, post-dissolve crank pays only non-burned depositors (end-to-end with burn integration).

Checklist:
- [ ] red then green incl. residual-after-dissolve row
