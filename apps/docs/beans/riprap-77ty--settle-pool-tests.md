---
# riprap-77ty
title: settle_pool + tests
status: completed
type: task
tags:
    - rust
    - tdd
created_at: 2026-09-01T17:39:11Z
updated_at: 2026-09-02T05:35:00Z
parent: riprap-ggsd
blocked_by:
    - riprap-9pdc
---

EVENT-MUTUAL §2.5/§7. Permissionless crank.
Gates: phase Active, now >= claims_close_at, claims_filed == claims_resolved (settlement waits for the LAST dispute — §2.5 amendment).
ratio_1e9 = min(1e9, vault_balance x 1e9 / (obligations + fee_refunds)) in u128 with checked ops; 1e9 when denominator zero. pull_close_at = now + pull_window (settlement-relative — the §2.5 amendment). phase = Settled; ratio frozen, every payout reads it.

Tests: solvent ratio 1_000_000_000, over-treasury ratio matches hand math exactly (u128 precision), zero obligations -> 1e9, reverts: window open, pending claim, wrong phase, double settle.

Checklist:
- [x] red then green; ratio math rows cite §8

## Summary of Changes

- `instructions/settle_pool.rs`: permissionless crank. Gates: phase Active (AlreadySettled), now ≥ claims_close_at (ClaimsWindowOpen), claims_filed == claims_resolved (ClaimsUnresolved — settlement waits for the last dispute, §2.5 amendment); treasury address verified against mutual.pool + deposit_mint; ratio_1e9 = min(1e9, vault × 1e9 / (obligations + fee_refunds)) fully in u128 checked ops, 1e9 when the denominator is zero; pull_close_at = now + pull_window (settlement-relative, §2.5 amendment); phase = Settled; PoolSettled emitted.
- Tests: solvent → ratio 1e9 + pull_close_at == settled_at + pull_window; over-treasury → 40e6 × 1e9 / 46e6 = 869565217 exact floor (§8 hand math cited in the assert); zero obligations → 1e9; reverts: window open, pending claim, double settle. 6/6.
- Shared `file_claim_raw`/`settle_claim_raw`/`cranker` promoted into tests/common (settle suites compose the full lifecycle through real instructions).
- clippy 0; pnpm verify 0.
