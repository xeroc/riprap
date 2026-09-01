---
# riprap-6zfr
title: claim_payout + tests
status: todo
type: task
tags:
    - rust
    - tdd
created_at: 2026-09-01T17:39:27Z
updated_at: 2026-09-01T17:39:27Z
parent: riprap-ggsd
blocked_by:
    - riprap-77ty
    - riprap-609b
---

EVENT-MUTUAL §2.4/§7 + §8 numbers. Claimant pull, idempotent.
Gates: phase Settled, now < pull_close_at, status Approved, co-signature of Mutual.authority (Breakpoint pass gate — spec §2.10 amendment / §12; passes verified off-chain, gate sits at payout).
payout = claim_amount x ratio_1e9 / 1e9 + fee_paid x ratio_1e9 / 1e9 (u128 intermediates, floor).
Atomic in one tx: CPI pool::spend(payout) to claimant ATA — rights authority [mutual_auth, mutual] invoke_signed; CPI pool::burn(Rights, depositor, min(payout, depositor.total_amount)) — saturates at contribution. status = Paid.

Tests: §8 solvent (2_015_000_000 units = 2,000 + 15 fee at ratio 1e9), §8 exhausted (ratio 661_665_700-ish per §8: 1,323.40 + 9.93 — exact integer base units, floor documented), missing authority co-sign reverts, pull after pull_close_at reverts, double pull reverts, burn saturates (depositor total -> 0), destination ATA is claimant-owned.

Checklist:
- [ ] red then green; §8 rows cite the worked example
