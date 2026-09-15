---
# riprap-609b
title: Implement pool burn instruction
status: completed
type: task
tags:
    - rust
created_at: 2026-09-01T17:38:53Z
updated_at: 2026-09-01T17:38:53Z
parent: riprap-rvk8
blocked_by:
    - riprap-gfm5
---

Wire the burn instruction into programs/pool house style:
- Accounts struct: pool (mut, Open constraint), track authority Signer (constraint == pool.authority(track)), depositor PDA seeds [depositor, pool, owner] with owner equality + not-settled constraint, owner UncheckedAccount bound by seeds (crank.rs pattern).
- handler_* calling the P1 accounting core; Burned event { pool, depositor, track, amount, stake_burned }; PoolError variants; one-line delegate in lib.rs.
- LiteSVM (tests/lifecycle.rs style): happy burn at rights rate 1; wrong authority reverts; burn after liquidate reverts; saturation burns are Ok and floor at balance.

Checklist:
- [x] instruction + event + errors + delegate
- [x] LiteSVM happy/auth/saturation rows green

## Summary of Changes

- `burn.rs`: `Burn` accounts struct — mut pool with `PoolNotOpen` constraint, track authority `Signer` gated by `pool.authority(track)` (update_authority pattern), mut depositor PDA `[depositor, pool, owner]` with owner equality + `!settled @ Settled` (crank pattern), `owner` UncheckedAccount bound by seeds. `handler_burn` calls the P1 core and emits `Burned { pool, depositor (owner key), track, amount, stake_burned }`.
- `events.rs`: `Burned`; `lib.rs`: one-line `burn` delegate; `mod.rs`: glob re-export restored; stale `#[allow(dead_code)]` removed from `apply`.
- LiteSVM (lifecycle.rs): `Env::burn` + `Env::depositor_state` helpers; 4 rows — happy burn at rate 1 (totals zero, treasury untouched — burn moves no tokens), wrong-track-authority reverts (state unchanged), burn after liquidate `PoolNotOpen`, over-burn Ok and floored at balance.
- `packages/pool` Codama client regenerated (`pnpm --filter @riprap/pool codegen`) — new `instructions/burn.ts` + `events/burned.ts` committed with the program change.
- Verified: `pnpm verify` exit 0 (22 unit + 9 lifecycle tests, anchor build, lint); `cargo build` zero warnings.
