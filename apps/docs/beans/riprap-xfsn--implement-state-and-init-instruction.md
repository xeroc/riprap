---
# riprap-xfsn
title: Implement state and init instruction
status: completed
type: task
created_at: 2026-09-01T05:12:51Z
updated_at: 2026-09-01T05:12:51Z
parent: riprap-4uzk
blocked_by:
    - riprap-15tk
---

## Summary of Changes

- `programs/pool/src/state.rs`: `Pool` (mint, state, 3× rate u64, 3× authority Pubkey, total_amount u128), `Depositor` (owner, total_amount u64, 3× stake u128, settled bool), `Track` and `PoolState` enums — field-for-field the handoff §2 data contract, `InitSpace` derived, `POOL_SPACE`=177 / `DEPOSITOR_SPACE`=97 pinned by unit tests citing the layout math.
- `Pool::rate(track)` / `Pool::authority(track)` accessors (unit-tested) for deposit and update_authority beans.
- `programs/pool/src/instructions/init.rs`: `InitPool` accounts — pool PDA at `["pool", seed le u64]`, treasury = pool PDA's own ATA per ADR-0001 (no swig CPI), args grouped in `InitParams` (seed, rates×3, authorities×3) to keep clippy's arg limit without losing named fields in the IDL. Added `anchor-spl = "1.0.2"` (+ idl-build feature propagation).
- No event for init: the handoff DoD enumerates exactly five (Deposit, Spent, Liquidated, CrankPaid, AuthorityUpdated); those are declared by the beans that emit them.
- Verified: `anchor build` exit 0 (init + InitParams in target/idl/pool.json), `cargo test` 5 passed, `cargo clippy --all-targets` zero warnings, `pnpm verify` exit 0.

