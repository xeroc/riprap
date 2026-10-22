---
"@riprap/hanse": patch
"@riprap/cli": patch
---

Review pass on the pilot-gate retirement: the `Unauthorized` error message drops its stale "pilot payout crank gate" clause (the codegen error maps follow), the `claim_payout` instruction doc in `lib.rs` and the CLI build-test titles state the permissionless crank, and the operator runbook (`SETUP.BLADE-POOL.md`) plus both launch scripts no longer describe the payout crank as authority-gated — the authority's only remaining power is subaccord param proposals.
