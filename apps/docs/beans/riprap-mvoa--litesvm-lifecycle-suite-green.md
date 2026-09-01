---
# riprap-mvoa
title: LiteSVM lifecycle suite green
status: completed
type: task
created_at: 2026-09-01T05:12:51Z
updated_at: 2026-09-01T05:12:51Z
parent: riprap-4uzk
blocked_by:
    - riprap-o3sx
---


## Summary of Changes

- `programs/pool/tests/lifecycle.rs`: full handoff §6 matrix against the real SBF build via LiteSVM (loads `target/deploy/pool.so`; run `anchor build` before `cargo test` — the gate bean must sequence this). Five tests: full lifecycle (deposits 10/20/40 → spend 2000 → liquidate → crank all → floors 9714285/19428571/38857142, dust 2, double-crank reverts Settled from a different cranker = permissionlessness proven), TrackClosed, non-authority spend/liquidate/update_authority reverts, authority rotation (K2 spends, K1 cannot), spend-after-liquidation PoolNotOpen.
- Uses the real SPL builtins: mint via system create_account + initialize_mint2, ATAs via create_associated_token_account_idempotent, balances via unpacked token accounts. Client ix data/accounts via anchor's generated `pool::instruction`/`pool::accounts`.
- **Bug 1 caught**: `Spend.destination` lacked `mut` — compiled clean, failed at runtime with PrivilegeEscalation on the treasury CPI. Fixed.
- **Bug 2 caught**: cranks recomputed `share × current balance` — payout order diluted later depositors (20-depositor would receive 16.65M of a 19.43M share; most of the treasury strandable). Fixed by freezing `Pool.liquidation_balance` at `liquidate()` (Liquidate now reads the treasury to snapshot); every crank pays against the frozen base. Space test updated (INIT_SPACE 178→186).
- Custom-error assertions compare `PoolError as u32 + 6000` codes from the Debug output (immune to solana crate error-type reshuffling); authority-guard reverts assert failure + unchanged state.
- Verified: `cargo test -p pool` 16 unit + 5 lifecycle green, `cargo clippy --all-targets` 0 warnings, `anchor build` 0, `pnpm verify` 0.
