---
# riprap-7wa9
title: SAS attestation integration missing — mutual ships stake-only juror pool
status: done
type: bug
priority: high
tags:
    - sas
    - mutual
created_at: 2026-09-01T17:32:29Z
updated_at: 2026-09-24T00:00:00Z
---

EVENT-MUTUAL.md §2.8 (closed circle: members judge members via SAS) was deferred. The mutual program (hanse) created its Subaccord WITHOUT the juror_credential/juror_schema binding — stake-only juror pool, any staker can be drawn, not members-only. MAJORITY-EXPLOIT.md §6 posture weakens accordingly (defense left: default juror stake = tier contribution).

**Implemented 2026-09-24** (ADR-0004): `programs/hanse/src/sas.rs` hand-encodes the SAS CPIs (canonical program 22zoJ…); `initialize_mutual` registers the mutual's credential (authority + sole signer = the mutual PDA) + schema (`"membership"`, layout `[U128, U128]` — wallet raw at `data[0..32]`) and creates the subaccord credential-bound; `join` issues the member attestation (`expiry = 0`, nonce = member key) onto `Member.attestation`. `Mutual` grew `juror_credential`/`juror_schema`; `AttestationReserved` → `AttestationAccountMismatch`. Proof: `programs/hanse/tests/attestation.rs` — member stakes with the join-issued attestation (credited), non-member reverts `AttestationMissing` (6057), stolen attestation reverts `AttestationSubjectMismatch` (6061); Surfpool e2e (all specs a–e) green with `ensureSasProgram` fabricating the loader accounts at the canonical address. SDK: `findSasCredentialPda`/`findSasSchemaPda`/`findSasAttestationPda` + `SAS_PROGRAM_ADDRESS` in `@riprap/hanse`.

Original notes (kept for history):
- SAS = solana-foundation/solana-attestation-service (public Pinocchio source), program 22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG; account layout resolved in accord meta/specs/PROG-ATTESTTION.md; attestation PDA ["attestation", credential, schema, nonce].
- initialize_mutual: register Credential (authority = mutual PDA) + schema via SAS CPI; pass juror_credential/juror_schema into accord create_subaccord CPI (both-or-neither, else AttestationBindingPartial).
- join: CPI SAS attest, issuer = mutual PDA (invoke_signed), subject = member wallet (data[0..32]), expiry = 0; store attestation pubkey on Member.
- Tests: SAS .so vendored into LiteSVM + Surfpool e2e (nothing in either repo CPIs into SAS yet — hanse is first).

Decision 2026-09-01 (hanse implementation grill): defer, ship degradation path. Decider: Fabian. Decision 2026-09-24: implement. Decider: Fabian.
