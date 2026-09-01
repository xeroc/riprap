---
# riprap-o3sx
title: Implement crank and update_authority instructions
status: completed
type: task
created_at: 2026-09-01T05:12:51Z
updated_at: 2026-09-01T05:12:51Z
parent: riprap-4uzk
blocked_by:
    - riprap-5xrc
---


## Summary of Changes

- `instructions/crank.rs`: permissionless post-liquidation crank — pool must be Liquidated, depositor PDA seeded `[depositor, pool, owner]` with owner-equality + !settled guards, payout to the owner's canonical ATA signed by the pool PDA, `settled = true`, `CrankPaid` event. Payout is pure `payout(treasury_balance, depositor_total, pool_total)` — u128 checked mul, floor div, money-weighted only (rates/stakes never enter).
- `instructions/update_authority.rs`: current track authority signs (`pool.authority(track)` constraint via `#[instruction(track)]`), swap via `Pool::set_authority` (unit-tested in state.rs), `AuthorityUpdated` event.
- `error.rs` += `PoolNotLiquidated`; `events.rs` += `CrankPaid`/`AuthorityUpdated` — DoD event set complete.
- 4 payout unit tests citing the matrix: 10/20/40 deposits after a 2000 spend → 714/1428/2857 floored, sum ≤ balance; full balance when nothing spent; dust lost to floor, never overpay; zero pool-total guarded by checked_div.
- Crank's `owner` is an `UncheckedAccount` bound by PDA seeds + owner equality — permissionless means anyone may crank a position, payout always lands with the depositor's owner.
- Verified: `anchor build` 0 warnings, `cargo test` 16 passed, `cargo clippy --all-targets` 0 warnings, `pnpm verify` 0. IDL: 6 instructions, 5 events.
