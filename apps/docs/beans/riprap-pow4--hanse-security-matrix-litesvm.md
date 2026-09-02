---
# riprap-pow4
title: Hanse security matrix (LiteSVM)
status: completed
type: task
tags:
    - rust
    - tdd
created_at: 2026-09-01T17:39:27Z
updated_at: 2026-09-02T08:35:00Z
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
- [x] matrix table in the test file header, one row per case, all green

## Summary of Changes

- `tests/security.rs`: 16-row matrix table in the header, one test per row, all green (15 runnable rows + S16 documented). Two-mutual world (seeds 1 + 2 in one env) drives every cross-mutual confusion case with real foreign accounts.
- Findings on error surfaces (anchor evaluates type/discriminator checks before constraint bodies — rows assert the precise surface, never a generic panic):
//  - S3 signer chain is enforced by the member-PDA seeds constraint itself (ConstraintSeeds), not the typed constraint — the typed NotMember still fires for a real cross-mutual member account (S6/S7/S8 shapes).
//  - S7/S8 required real foreign member/mutual accounts (joined + settled) so the intended bindings — not AccountNotInitialized/NotSettled — are what rejects.
//  - S11 re-file at a consumed nonce hits the Claim PDA init guard ("already in use") before the handler's NonceMismatch — both defenses hold; matrix records the earlier one. NonceMismatch itself is covered in the file_claim suite (unused wrong nonce).
- Rows: S1 payout w/o co-sign (Unauthorized), S2 non-admin param (Unauthorized), S3 signer chain (ConstraintSeeds), S4 foreign pool (WrongPool), S5 foreign subaccord (WrongSubaccord), S6 foreign member PDA (ConstraintSeeds), S7 foreign claim at settle (NotMember), S8 foreign claim at payout (NotMember, both mutuals Settled so the claim binding is the rejecter), S9/S10 mutual/member re-init ("already in use"), S11 claim re-init (PDA guard), S12 drained-treasury ratio 0 → payout floors to 0, claim flips Paid, burn 0 (fabricated token-account rewrite), S13 zero request (InvalidClaimAmount), S14 non-terminal dispute (DisputeNotFinal), S15 payout before settle_pool (NotSettled), S16 overflow-guard note (u64 × 1e9 ≈ 1.8e28 < u128::MAX — unreachable by construction, guards stay defensive).
- clippy 0; `pnpm verify` exit 0.
