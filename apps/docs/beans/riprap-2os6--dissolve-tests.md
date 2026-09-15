---
# riprap-2os6
title: dissolve + tests
status: completed
type: task
tags:
    - rust
    - tdd
created_at: 2026-09-01T17:39:27Z
updated_at: 2026-09-02T07:50:00Z
parent: riprap-ggsd
blocked_by:
    - riprap-6zfr
---

EVENT-MUTUAL §7. Permissionless crank.
Gates: phase Settled, now >= pull_close_at.
CPI pool::liquidate via [mutual_own, mutual] (ownership authority). phase = Dissolved. Unpulled approved amounts stay in the treasury -> residual; members exit via pool crank directly — NO mutual wrapper (spec §7).

Tests: happy (pool Liquidated, liquidation_balance snapshot set), early dissolve reverts (warp before pull_close_at), double dissolve reverts, post-dissolve crank pays only non-burned depositors (end-to-end with burn integration).

Checklist:
- [x] red then green incl. residual-after-dissolve row

## Summary of Changes

- `instructions/dissolve.rs`: permissionless crank. Gates: phase Settled (constraint → NotSettled, covers double dissolve), now ≥ pull_close_at (new PullWindowOpen error — the window must be OVER before the residual reverts). CPI `pool::liquidate` signed by the [mutual_own, mutual] PDA (seeds-verified UncheckedAccount in context); phase = Dissolved; MutualDissolved emitted. No residual wrapper — members exit via the pool crank directly (§7).
- Tests: happy (pool Liquidated, liquidation_balance == live treasury snapshot, mutual Dissolved), early dissolve (warp to pull_close_at − 1 → PullWindowOpen), double dissolve (NotSettled), and the end-to-end residual row: claimant pulls $2,015 (burn to zero), dissolve, pool crank pays the burned member exactly 0 and the sole remaining member the full residual 17_985_000_000 ($20,000 − $2,015) — §8 "if claims don't consume the pool, the money comes back" + §2.4 burn integration. 4/4.
- clippy 0; `pnpm verify` exit 0.
