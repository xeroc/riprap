---
# riprap-7wa9
title: SAS attestation integration missing — mutual ships stake-only juror pool
status: todo
type: bug
priority: high
tags:
    - sas
    - mutual
created_at: 2026-09-01T17:32:29Z
updated_at: 2026-09-01T17:32:29Z
---

EVENT-MUTUAL.md §2.8 (closed circle: members judge members via SAS) is deferred. The mutual program (hanse) creates its Subaccord WITHOUT the juror_credential/juror_schema binding — stake-only juror pool, any staker can be drawn, not members-only. MAJORITY-EXPLOIT.md §6 posture weakens accordingly (defense left: default juror stake = tier contribution).

What the integration needs when picked up:
- SAS = solana-foundation/solana-attestation-service (public Pinocchio source), program 22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG; account layout resolved in accord meta/specs/PROG-ATTESTTION.md; attestation PDA ["attestation", credential, schema, nonce].
- initialize_mutual: register Credential (authority = mutual PDA) + schema via SAS CPI; pass juror_credential/juror_schema into accord create_subaccord CPI (both-or-neither, else AttestationBindingPartial).
- join: CPI SAS attest, issuer = mutual PDA (invoke_signed), subject = member wallet (data[0..32]), expiry = 0; store attestation pubkey on Member.
- Tests: SAS .so vendored into LiteSVM + Surfpool e2e (nothing in either repo CPIs into SAS yet — hanse is first).

Decision 2026-09-01 (hanse implementation grill): defer, ship degradation path. Decider: Fabian.
