---
# riprap-e5t9
title: 'e2e spec c: over-treasury proportional pulls'
status: todo
type: task
tags:
    - ts
    - e2e
created_at: 2026-09-01T17:40:03Z
updated_at: 2026-09-01T17:40:03Z
parent: riprap-oaa8
blocked_by:
    - riprap-zuco
---

EVENT-MUTUAL §2.5/§8 exhausted path: approvals exceed treasury; settle_pool ratio < 1e9 matching hand math; TWO claimants pull in OPPOSITE orders and receive IDENTICAL proportional amounts (no landing-order lottery — the core §2.5 invariant); residual is dust only; burn saturation still zeroes paid claimants out of the residual.

Checklist:
- [ ] spec green; order-independence asserted explicitly
