---
# riprap-gfm5
title: TDD pool burn accounting core
status: todo
type: task
tags:
    - rust
    - tdd
created_at: 2026-09-01T17:38:53Z
updated_at: 2026-09-01T17:38:53Z
parent: riprap-rvk8
---

Pure accounting fn in programs/pool/src/instructions/burn.rs mirroring deposit::apply — red unit tests FIRST.

Semantics (grill 2026-09-01 Q1): burn(track, amount) decrements depositor.total_amount by amount, the depositor track stake by amount x rate(track), and pool.total_amount by amount — all saturating at balances, checked math. Burn moves NO tokens (spend already moved them); it only removes the depositor from the money-weighted residual split. Rate-1 rights: burning min(payout, contribution) zeroes the depositor total — exactly the EVENT-MUTUAL §2.4/§8 exclusion of paid claimants from residual.

Unit tests (colocated, deposit.rs test style): basic burn at rate 1; rate 2 (stake drops amount x rate, totals drop amount); saturation when amount exceeds total_amount; saturation when amount x rate exceeds track stake; liquidated pool reverts; overflow guards.

Checklist:
- [ ] red unit tests for the accounting fn
- [ ] green impl (apply-style, no instruction wiring yet)
