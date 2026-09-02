---
# riprap-gfm5
title: TDD pool burn accounting core
status: completed
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
- [x] red unit tests for the accounting fn
- [x] green impl (apply-style, no instruction wiring yet)

## Summary of Changes

- `programs/pool/src/instructions/burn.rs`: `apply(pool, depositor, track, amount) -> Result<u128>` — pure burn accounting mirroring `deposit::apply`. Guard: `PoolNotOpen` (liquidation freezes burn, spec §5). Money side saturates at the depositor balance (`amount.min(total_amount)`), and depositor total + `pool.total_amount` drop by the SAME effective amount so `pool.total` keeps equaling the sum of depositor totals (§8 crank denominator). Stake side: `amount x rate` in a `u128` checked intermediate, `saturating_sub` at the track stake. Moves no tokens; returns the stake actually burned.
- 6 colocated tests, deposit.rs style, written red-first against a `todo!()` stub: rate-1 residual exit (§2.4/§8, two depositors — pool total drops to the unburned member's), rate-2 stake math, amount-over-total saturation, stake-over-track saturation, liquidated reverts, u64-extremes no-overflow.
- `instructions/mod.rs`: `pub mod burn;` registered; no glob re-export yet (nothing public — the instruction wiring lands with riprap-609b).
- Verified: `pnpm verify` green (22 lib + 5 lifecycle tests, anchor build, lint); `cargo build` zero warnings.
