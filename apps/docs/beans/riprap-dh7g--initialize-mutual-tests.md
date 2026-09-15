---
# riprap-dh7g
title: initialize_mutual + tests
status: completed
type: task
tags:
    - rust
    - tdd
created_at: 2026-09-01T17:39:11Z
updated_at: 2026-09-02T03:20:00Z
parent: riprap-ggsd
blocked_by:
    - riprap-e6iq
    - riprap-s3ta
---

EVENT-MUTUAL §7. Permissionless init; records authority = initializer (demo admin, §2.10).

Config: seed, tiers (exactly 3, contribution > 0, max_payout >= contribution), policy_hash, deposits_close_at, claims_close_at, pull_window, full subaccord parameter set forwarded verbatim (min_jury_size odd + ladder fits MAX_JURORS, aggregation fixed Plurality, fee_per_juror, min_stake, alpha_bps, review/commit/reveal/appeal windows, reveal_threshold_bps, shortfall Redraw, max_draw_attempts; juror_credential/juror_schema = Pubkey::default — stake-only, bean riprap-7wa9).
Validation BEFORE any CPI: claims_close_at > deposits_close_at > now, pull_window > 0, tier sanity, accord domain bounds — typed errors, never rely on the CPI failing.
CPI pool::init: rights_rate 1, ownership_rate 0, yield_rate 0; rights authority [mutual_auth, mutual], ownership authority [mutual_own, mutual].
CPI accord::create_subaccord: authority = mutual PDA, staking_token = fee_token = deposit_mint, domain_ref + evidence_spec derivation documented in code.
Fee float: mutual-PDA ATA of fee_mint.

Tests: happy (pool + subaccord + float wired exactly), re-init revert, bad timestamps, bad tiers, even min_jury_size rejection.


Checklist:
- [x] red tests then green
- [x] config validation errors typed and asserted

## Summary of Changes

- `instructions/initialize_mutual.rs`: full instruction per §7 — validation BEFORE any CPI (timestamps ordered, pull window, tier sanity, odd jury + ladder ≤ MAX_JURORS, accord domain bounds mirrored: alpha/min_stake/windows/appeal floor/threshold/draw attempts/fee product), mutual account init, CPI `pool::init` (rights 1:1 under mutual_auth, ownership 0 under mutual_own, yield off), CPI `accord::create_subaccord` (Plurality, Redraw, depth 20, stake-only credential default, authority = mutual PDA), fee float ATA (init_if_needed), MutualInitialized emitted.
- Config: `InitializeMutualConfig { seed, tiers, policy_hash, deposits/claims_close_at, pull_window, subaccord: SubaccordConfig }` — the full forwarded parameter set incl. evidence_operator; aggregation/shortfall/depth/credentials fixed in code with provenance comments.
- domain_ref = sha256("hanse:subaccord" ‖ seed ‖ policy_hash) — binds the juror namespace to seed AND cover terms; evidence_spec = sha256("hanse:evidence:v1"). Both documented in code.
- Deviation from a natural reading, forced by chain mechanics (synod file_dispute precedent, cited in code): `create_subaccord`'s creator is the INITIALIZER WALLET, not the mutual PDA — system rejects rent payment from data accounts and accord's instruction has no separate rent-payer field. The mutual PDA remains the subaccord's `authority` (all powers). Subaccord PDA therefore = ["subaccord", initializer, domain_ref]; handler verifies it manually (seeds constraint with a fn call doesn't compile under idl-build — noted in CHECK comment).
- Tests (red first): happy path asserts mutual + pool (rates/authorities) + subaccord (creator/authority/Plurality/params/credentials) + float wiring; re-init revert; bad timestamps (3); bad tiers (2); even jury + ladder overflow. 5/5 green; clippy zero warnings; `pnpm verify` exit 0 (LiteSVM runs the real pool and accord binaries through both CPIs).
