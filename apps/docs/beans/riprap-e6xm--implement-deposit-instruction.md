---
# riprap-e6xm
title: Implement deposit instruction
status: completed
type: task
created_at: 2026-09-01T05:12:51Z
updated_at: 2026-09-01T05:12:51Z
parent: riprap-4uzk
blocked_by:
    - riprap-xfsn
---

## Summary of Changes

- `instructions/deposit.rs`: `Deposit` accounts — pool (Open constraint), depositor PDA `["depositor", pool, owner]` `init_if_needed` with settled-guard, owner signer, owner ATA (token::mint/authority = pool.mint/owner), treasury (mint + token-program owner constraints). Pure `apply()` core: Open/track-rate>0/!settled checks, `stake = amount × rate` in u128 checked math, per-track stake accumulation, pool total — all `PoolError::MathOverflow`-checked.
- Instruction body inline in `lib.rs` (anchor 1.x codegen rejects non-glob re-exports and collides on duplicate handler names — accounts+pure-logic modules with inline bodies is the shape that compiles warning-free); CPI `token::transfer` owner→treasury after state math so a failed transfer reverts nothing; `events::Deposit` emitted (pool, depositor, track, amount, stake).
- `error.rs`: PoolNotOpen / TrackClosed / Settled / MathOverflow. `events.rs`: Deposit. `anchor-lang` gains `init-if-needed` feature.
- 6 unit tests on the pure core citing the matrix: 20 USDC @ rights_rate=1 → stake 20e6; zero-rate → TrackClosed; Liquidated → PoolNotOpen; settled → Settled; per-track accumulation; stake-overflow → MathOverflow.
- Verified: `anchor build` 0, `cargo test` 11 passed, `cargo clippy --all-targets` 0 warnings, `pnpm verify` 0.

