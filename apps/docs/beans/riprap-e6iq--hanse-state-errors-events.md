---
# riprap-e6iq
title: Hanse state, errors, events
status: completed
type: task
tags:
    - rust
    - tdd
created_at: 2026-09-01T17:38:53Z
updated_at: 2026-09-02T02:20:00Z
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
- [x] state + constants + errors + events with unit tests

## Summary of Changes

- `state.rs` (EVENT-MUTUAL §6, amended 2026-09-01): `Mutual` (immutable block + settlement block incl. `claim_nonce`), `Member` (with RESERVED `attestation: Pubkey` — always default, bean riprap-7wa9 — and `has_pending_claim`), `Claim` (status ladder Pending/Approved/Denied/Failed/Paid), `Tier { contribution, max_payout }`, `Phase` enum; seeds `mutual`/`member`/`claim` + `*_SPACE` constants. No `Option` anywhere — sentinels per house style.
- TDD red-first: INIT_SPACE assertions (Mutual 314, Member 99, Claim 130, Tier 16 → spaces 322/107/138/8+16) + Phase/ClaimStatus borsh round-trips pinning wire discriminants 0..n + seed constants test. 8/8 green. Round-trips use `::borsh::to_vec` (anchor 1.x derives wire borsh 1.x; dev-dep `borsh = "1.8"`).
- `error.rs`: `HanseError` fully enumerated with doc comments — per-§7 gates (DepositsClosed/ClaimsClosed/NoRightsStake/PendingClaimExists/ClaimsUnresolved/PullWindowClosed/ClaimNotApproved/ClaimAlreadyPaid/Unauthorized/…) + invariants (MathOverflow, AttestationReserved).
- `events.rs`: one event per §7 transition — MutualInitialized, MemberJoined, ClaimFiled, ClaimSettled (carries resulting ClaimStatus), PoolSettled (ratio frozen), PayoutClaimed, MutualDissolved. set_subaccord_param's event deferred to its bean (xfqj) — param wire type is defined there.
- `lib.rs` re-exports `HanseError` + state per pool pattern. `cargo clippy -p hanse --all-targets` zero warnings; `pnpm verify` exit 0; IDL carries events + ClaimStatus.
