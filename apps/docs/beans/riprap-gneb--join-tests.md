---
# riprap-gneb
title: join + tests
status: todo
type: task
tags:
    - rust
    - tdd
created_at: 2026-09-01T17:39:11Z
updated_at: 2026-09-01T17:39:11Z
parent: riprap-ggsd
blocked_by:
    - riprap-dh7g
---

EVENT-MUTUAL §2.7/§7. Member-signed.
Gates: now < deposits_close_at, no existing Member (init — one tier per member, no stacking), tier < 3.
Flow: CPI pool::deposit(track Rights, contribution) with owner = member signer, member ATA -> treasury (member is also depositor rent payer for v1; pool supports a separate sponsor if ever needed). Then Member PDA init (tier, attestation default, has_pending false).
Tests: happy (pool Depositor rights_stake == contribution at rate 1, Member fields exact), after deposits_close_at reverts (clock warp), duplicate join reverts (same or different tier), tier out of range reverts, wrong-mint ATA reverts.

Checklist:
- [ ] red then green incl. deadline warp row
