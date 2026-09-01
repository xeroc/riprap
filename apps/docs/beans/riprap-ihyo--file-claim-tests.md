---
# riprap-ihyo
title: file_claim + tests
status: todo
type: task
tags:
    - rust
    - tdd
created_at: 2026-09-01T17:39:11Z
updated_at: 2026-09-01T17:39:11Z
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
- [ ] red then green; option/evidence derivations unit-tested
