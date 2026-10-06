---
"@riprap/hanse": minor
"@riprap/cli": minor
"@riprap/landing": minor
---

Concurrent claims per membership: `file_claim` no longer serializes filings
(`has_pending` gate removed) and no longer requires `rights_stake > 0` — the
cumulative per-membership tier cap (`cap_used`, `TierCapExhausted`) is the only
filing limiter, so chunked claiming works for the full cap instead of locking
out after contribution-worth of payouts. `Member` drops `has_pending_claim`,
`file_claim` drops the depositor account, and the error set drops
`PendingClaimExists`/`NoRightsStake` (codes after `NotMember` shift down two).
The CLI `hanse:member` dump shows cap used; the wizard's preflight gates on
cap remaining and the amount step clamps to it (EVENT-MUTUAL amendment
2026-10-05, ADR-0008).
