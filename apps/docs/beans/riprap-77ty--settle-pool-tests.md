---
# riprap-77ty
title: settle_pool + tests
status: todo
type: task
tags:
    - rust
    - tdd
created_at: 2026-09-01T17:39:11Z
updated_at: 2026-09-01T17:39:11Z
parent: riprap-ggsd
blocked_by:
    - riprap-9pdc
---

EVENT-MUTUAL §2.5/§7. Permissionless crank.
Gates: phase Active, now >= claims_close_at, claims_filed == claims_resolved (settlement waits for the LAST dispute — §2.5 amendment).
ratio_1e9 = min(1e9, vault_balance x 1e9 / (obligations + fee_refunds)) in u128 with checked ops; 1e9 when denominator zero. pull_close_at = now + pull_window (settlement-relative — the §2.5 amendment). phase = Settled; ratio frozen, every payout reads it.

Tests: solvent ratio 1_000_000_000, over-treasury ratio matches hand math exactly (u128 precision), zero obligations -> 1e9, reverts: window open, pending claim, wrong phase, double settle.

Checklist:
- [ ] red then green; ratio math rows cite §8
