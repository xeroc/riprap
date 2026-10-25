---
"@riprap/hanse": patch
---

Bump the accord cross-repo pin (`programs/hanse/Cargo.toml`) from `ba91bd8` to `25c48b28` — past the ADR-0030/0033 fee semantics the deployed artifacts already encode. The old pin's `filing_fee()` was `J·fpj` while `file_claim` tenders `(J+1)·fpj` (the ADR-0030 filer bounty unit): a mainnet accord artifact faithfully built from the old pin would revert every filing with `FeeMismatch` (audit R-1, bean riprap-h2pd). Pin-bump contract re-verified at the new rev: fee shape exact, `DisputeState::Closed` still unwritten, Failed refund = full tender (`fee_paid` + bounty, never decremented), `Dispute.bounty_pool` carved from tail padding with all prior offsets unchanged. Lockfile: anchor-lang/anchor-spl unify to 1.2.0, accord 0.3.0; `tests/deps/accord.so` refreshed from the new rev; `.surfpool` ledger cleared.
