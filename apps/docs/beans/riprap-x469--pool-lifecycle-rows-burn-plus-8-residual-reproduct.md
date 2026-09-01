---
# riprap-x469
title: 'Pool lifecycle rows: burn plus §8 residual reproduction'
status: todo
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
- [ ] residual math rows green with §8 citation
- [ ] cargo test workspace green
