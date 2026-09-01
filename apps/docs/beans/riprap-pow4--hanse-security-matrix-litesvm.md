---
# riprap-pow4
title: Hanse security matrix (LiteSVM)
status: todo
type: task
tags:
    - rust
    - tdd
created_at: 2026-09-01T17:39:27Z
updated_at: 2026-09-01T17:39:27Z
parent: riprap-ggsd
blocked_by:
    - riprap-2os6
    - riprap-xfqj
---

Systematic negative suite across ALL instructions (safe-solana-builder checklist categories cited in comments):
- wrong signer on every gated instruction (claim_payout without authority co-sign, set_subaccord_param non-admin, join/file_claim signer chains)
- cross-mutual confusion: pool, subaccord, member, claim, dispute from a DIFFERENT mutual must fail every instruction (seed + constraint checks)
- re-initialization of Mutual / Member / Claim
- arithmetic edges: ratio at 1e9 and 0, u128 overflow guards on payout multiplication, zero amounts
- stale CPI state: settle_claim on non-terminal dispute, claim_payout before settle_pool
Every case asserts a typed HanseError — no generic panic, no unwrap on user paths.

Checklist:
- [ ] matrix table in the test file header, one row per case, all green
