---
# riprap-e6iq
title: Hanse state, errors, events
status: todo
type: task
tags:
    - rust
    - tdd
created_at: 2026-09-01T17:38:53Z
updated_at: 2026-09-01T17:38:53Z
parent: riprap-ggsd
blocked_by:
    - riprap-7ly4
---

EVENT-MUTUAL §6 as amended 2026-09-01. No Option anywhere — sentinels per house style.

- Mutual PDA [mutual, seed u64 le]: immutable authority (initializer — demo admin), pool, subaccord, deposit_mint, fee_mint, policy_hash [u8;32], tiers [Tier;3] { contribution u64, max_payout u64 }, deposits_close_at i64, claims_close_at i64, pull_window i64; settlement: phase u8 (0 Active, 1 Settled, 2 Dissolved), pull_close_at i64, ratio_1e9 u64, obligations u64, fee_refunds u64, claims_filed u32, claims_resolved u32, claim_nonce u64, bump.
- Member PDA [member, mutual, member]: mutual, member, tier u8, attestation Pubkey (RESERVED, always Pubkey::default — SAS bean riprap-7wa9; kept to avoid account-space migration), has_pending_claim bool (one Pending claim per member), bump.
- Claim PDA [claim, mutual, nonce]: mutual, member, claim_amount u64 (clamped at filing), dispute Pubkey, fee_paid u64, status u8 (0 Pending 1 Approved 2 Denied 3 Failed 4 Paid), filed_at i64, settled_at i64, bump.
- Constants: seeds, spaces; errors fully enumerated with doc comments; events for every transition.
Unit tests: exact INIT_SPACE assertions + enum round-trips (pool state.rs test pattern).

Checklist:
- [ ] state + constants + errors + events with unit tests
