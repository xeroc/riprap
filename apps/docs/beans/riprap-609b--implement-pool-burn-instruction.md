---
# riprap-609b
title: Implement pool burn instruction
status: todo
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
- [ ] instruction + event + errors + delegate
- [ ] LiteSVM happy/auth/saturation rows green
