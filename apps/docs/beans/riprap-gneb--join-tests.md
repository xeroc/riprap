---
# riprap-gneb
title: join + tests
status: completed
type: task
tags:
    - rust
    - tdd
created_at: 2026-09-01T17:39:11Z
updated_at: 2026-09-02T03:50:00Z
parent: riprap-ggsd
blocked_by:
    - riprap-dh7g
---

EVENT-MUTUAL §2.7/§7. Member-signed.
Gates: now < deposits_close_at, no existing Member (init — one tier per member, no stacking), tier < 3.
Flow: CPI pool::deposit(track Rights, contribution) with owner = member signer, member ATA -> treasury (member is also depositor rent payer for v1; pool supports a separate sponsor if ever needed). Then Member PDA init (tier, attestation default, has_pending false).
Tests: happy (pool Depositor rights_stake == contribution at rate 1, Member fields exact), after deposits_close_at reverts (clock warp), duplicate join reverts (same or different tier), tier out of range reverts, wrong-mint ATA reverts.


Checklist:
- [x] red then green incl. deadline warp row

## Summary of Changes

- `instructions/join.rs`: gates before CPI (now < deposits_close_at → DepositsClosed, tier < 3 → TierInvalid), CPI `pool::deposit(Rights, contribution)` with owner = member signer and rent_payer = member (v1 self-sponsoring), Member PDA init (tier, attestation default, has_pending_claim false, bump), MemberJoined emitted. Anti-stacking = the Member PDA `init` itself.
- Errors added: WrongPool (pool ≠ mutual.pool), WrongMint (deposit mint mismatch).
- Tests (red first): happy (Depositor.rights_stake == 20e6 at rate 1, treasury funded, Member fields exact incl. reserved attestation), deadline warp (revert at close, pass at close-1), duplicate join same+other tier ("already in use"), tier 3/255, wrong-mint ATA (pool CPI rejects). LiteSVM tx-dedup dodged via expire_blockhash (pool lifecycle precedent).
- Shared `default_config`/`init_mutual`/`setup_with_mutual` moved into tests/common for all later instruction suites.
- 5/5 green, clippy 0, pnpm verify 0.
