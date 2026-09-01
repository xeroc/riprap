---
# riprap-dh7g
title: initialize_mutual + tests
status: todo
type: task
tags:
    - rust
    - tdd
created_at: 2026-09-01T17:39:11Z
updated_at: 2026-09-01T17:39:11Z
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
- [ ] red tests then green
- [ ] config validation errors typed and asserted
