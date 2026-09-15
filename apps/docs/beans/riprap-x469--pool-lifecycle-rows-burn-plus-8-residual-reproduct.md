---
# riprap-x469
title: 'Pool lifecycle rows: burn plus §8 residual reproduction'
status: completed
type: task
tags:
    - rust
created_at: 2026-09-01T17:38:53Z
updated_at: 2026-09-01T17:38:53Z
parent: riprap-rvk8
blocked_by:
    - riprap-609b
---

Extend programs/pool/tests/lifecycle.rs:
- burn regression rows (auth matrix done in prior bean; here: burn leaves treasury balance untouched, totals/stake drop, double burn to saturation floors at 0).
- §8-shaped residual proof at small scale with cleanly dividing numbers: N members deposit equal rights; M of them are paid via spend + burn(contribution); liquidate; crank every depositor — assert paid claimants receive 0 residual, the others split the remainder exactly per money-weighted math (mirrors EVENT-MUTUAL §8: 4 paid of 1000, residual across the 996 only). Test names cite spec sections.
- full existing suite stays green (no behavior change outside burn).

Checklist:
- [x] residual math rows green with §8 citation
- [x] cargo test workspace green

## Summary of Changes

- `tests/lifecycle.rs` +2 rows: `burn_2_4_double_burn_floors_at_zero` (partial burn leaves 600k totals/stake; second over-burn is Ok and floors at 0; treasury untouched throughout) and `event_mutual_8_paid_claimants_get_zero_residual` — 6 equal rights deposits, 2 paid via the §2.4 pair (spend 500k + burn of the 1M contribution), liquidate freezes 5M, crank all 6: paid claimants receive exactly 0, the other 4 receive 1_250_000 each, treasury drains to exactly 0. §8 shape (paid minority excluded, residual across the rest) reproduced end-to-end with cleanly dividing numbers.
- Treasury-untouched/totals-drop regression rows were already asserted in the 609b rows (`burn_happy_path_rate_1_moves_no_tokens`, `burn_saturates_at_balance`); this bean adds the double-burn floor.
- Verified: `cargo test` 11 lifecycle + 22 unit tests green; `pnpm verify` exit 0; `cargo build` zero warnings.
