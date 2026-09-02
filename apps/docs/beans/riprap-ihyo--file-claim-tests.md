---
# riprap-ihyo
title: file_claim + tests
status: completed
type: task
tags:
    - rust
    - tdd
created_at: 2026-09-01T17:39:11Z
updated_at: 2026-09-02T04:30:00Z
parent: riprap-ggsd
blocked_by:
    - riprap-gneb
---

EVENT-MUTUAL §2.3/§2.6/§7.
Gates: Member exists, has_pending false, pool Depositor rights_stake > 0 (burned-out member cannot file), now < claims_close_at, requested > 0.
Clamp at filing: claim_amount = min(requested, tiers[tier].max_payout) — the tier the member bought, not adjudicated capping (§2.3).
Fee: min_jury_size x fee_per_juror; member fee ATA -> mutual float ATA (member signs, exact amount).
Options: two salted hashes, Approve index 0 / Deny index 1 — scheme H("hanse-opt" || mutual || index) per the synod option_label pattern; document so TS e2e reproduces the ruling mapping.
Evidence hash: sha256 manifest = claimant evidence_hash || tier || contribution || treasury balance at filing (solana_program hashv).
CPI accord::create_dispute: filer = mutual PDA (invoke_signed), rent_payer = claimant wallet (data-free signer, ADR-0028), filer_token_account = float ATA, nonce = Mutual.claim_nonce.
Claim PDA init Pending; claims_filed += 1; claim_nonce += 1; member.has_pending = true.

Tests: clamp at tier cap, exact fee transfer, second pending claim reverts, late filing reverts (warp), non-member reverts, zero rights stake reverts, dispute PDA bound to mutual + nonce.


Checklist:
- [x] red then green; option/evidence derivations unit-tested

## Summary of Changes

- `instructions/file_claim.rs`: gates before money moves (phase Active, now < claims_close_at, nonce == mutual.claim_nonce — the Claim PDA seed is passed as an explicit instruction arg because seeds constraints cannot read account data, requested > 0, tier in range, Member PDA seeds+identity constraints, one-Pending gate), tier clamp `min(requested, tiers[tier].max_payout)`, depositor PDA + treasury ATA + dispute PDA verified in handler, fee = min_jury_size × fee_per_juror read LIVE from the subaccord, member fee ATA → float transfer, CPI `accord::create_dispute` (filer = mutual PDA via invoke_signed, rent_payer = claimant, float pays fee, options = salted labels, evidence = structural manifest), Claim init Pending, counters + has_pending flip, ClaimFiled emitted.
- Option recipe documented for the TS e2e (Approve = 0 / Deny = 1): `H("hanse-opt" ‖ mutual ‖ index_le)`; evidence manifest `H(evidence_hash ‖ tier ‖ contribution_le ‖ treasury_balance_le)` — both unit-tested (deterministic, distinct, sensitivity-bound).
- State fix required by this instruction: `Mutual.seed` now persisted (restated from PDA seeds, pool precedent) — invoke_signed as the mutual needs seeds+bump; MUTUAL_SPACE 322 (+8), space test updated.
- Mechanics notes: subaccord must be passed `mut` (accord writes fee tracking); accord's staker_count ≥ min_jury_size gate armed in tests by fabricating the count on the subaccord (`arm_subaccord`) — no voting/staking flows in the Rust suites by design; contexts Box the heavy accounts (SBF stack).
- Tests: happy (claim Pending, fee member→float→fee_vault exact, counters/has_pending, dispute filer=mutual/nonce/options/manifest/clamp-under-cap), tier-cap clamp, second pending reverts, late filing (warp, pass at close-1), non-member (AccountNotInitialized for a true stranger — typed NotMember fires for a cross-mutual Member PDA), zero rights stake (fabricated burn-out), nonce mismatch. 7/7 + 2 unit; clippy 0; pnpm verify 0.
