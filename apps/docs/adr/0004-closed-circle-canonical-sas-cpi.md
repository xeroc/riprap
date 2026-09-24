---
status: accepted
---

# 0004 — The closed circle rides the canonical SAS program (hand-encoded CPI)

Decided 2026-09-24, implementing bean riprap-7wa9 / EVENT-MUTUAL §2.8. The mutual's Subaccord is credential-gated: only wallets holding a membership attestation issued by `join` can stake into it and be drawn. Accord's side of the gate (ADR-0024 in the accord repo) was already built and pinned; this ADR records the hanse-side wiring decisions.

## Why

§2.8's 2026-09-01 deferral shipped a stake-only juror pool: any wallet could stake into the mutual's Subaccord, so outside capital — not just members — could hold draw weight. The thesis is "members judge members". With accord's gate available at the pinned rev, the remaining cost was one CPI module and two reserved fields.

## Decision

- **Canonical program, fixed address.** hanse CPIs into the real Solana Attestation Service at `22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG`, hardcoded in `programs/hanse/src/sas.rs`. Not configurable: accord's gate accepts attestations owned by exactly this program, so a configurable id could only produce attestations the gate rejects.
- **Hand-encoded instructions.** SAS is a Pinocchio program — no Anchor CPI crate. `sas.rs` encodes `CreateCredential` (tag 0), `CreateSchema` (tag 1), and `CreateAttestation` (tag 6) per the SAS source: one `u8` tag, then `u32`-LE-length-prefixed args; PDAs `["credential", authority, name]` / `["schema", credential, name, [1]]` / `["attestation", credential, schema, nonce]`.
- **The mutual PDA is the issuer.** The credential's authority and sole authorized signer is the mutual PDA (it signs via `invoke_signed`), so `join` is the only path that can ever issue a membership attestation — the closed circle is structural, not policy.
- **Fixed names, derived addresses.** Credential name `"members"`, schema name `"membership"`, schema version 1. The addresses derive from the mutual; nothing is caller-supplied; `Mutual.juror_credential`/`juror_schema` store them for reads.
- **Schema layout `[U128, U128]`** (two `SchemaDataTypes` tags `4, 4`). This is the only fixed-width composition that satisfies both sides: SAS `validate_data` walks the layout (16 + 16 = `data.len()`), and the subject wallet sits raw at `data[0..32]`, the exact offset accord's gate reads. A `VecU8` field would prepend a `u32` length and shift the wallet off the gate's fixed offset.
- **Nonce = member key, `expiry = 0`.** The attestation PDA is derivable from `(credential, schema, member)` without a fetch (SAS nonces are free-form — the pin is ours). Never-expiring means `prune_juror` can never fire and members never renew: the circle ends when the pool dissolves.
- **Errors:** `HanseError::AttestationReserved` (the v1 placeholder) is replaced by `AttestationAccountMismatch` — wrong credential/schema/attestation accounts in `join`.

## Consequences

- `initialize_mutual` CPIs credential + schema registration before `create_subaccord` and passes the pair in; `join` CPIs the attestation after the deposit and stores it on `Member.attestation` (the reserved field — no space migration).
- `stake` needs the attestation as `remaining_accounts[0]` and `draw_seat` re-checks it as `remaining_accounts[1]` (both accord-side). The e2e harness derives the attestation PDAs via `@riprap/hanse` and appends the account to `drawSeat` locally — the `@useaccord/sdk` facade does not yet grow the draw-side arg.
- Tests: the Rust LiteSVM lane loads the SAS `.so` from the sibling checkout (`SAS_SO`, default `…/solana-attestation-service/target/deploy/solana_attestation_service.so`); the Surfpool e2e cannot deploy at the canonical address (the keypair is not ours), so `ensureSasProgram` fabricates the two upgradeable-loader accounts via the `surfnet_setAccount` cheatcode with the real ELF.
- MAJORITY-EXPLOIT §6: the gate removes outside capital but not account-splitting — honest-base scaling stays the primary defense (the credential is issued by the very join an attacker performs).
