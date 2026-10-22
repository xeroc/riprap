---
# riprap-g9sz
title: Review pilot-gate retirement
status: completed
type: task
assigned: reviewer
priority: normal
created_at: 2026-10-15T08:01:18Z
updated_at: 2026-10-15T15:10:00Z
parent: riprap-hxed
blocked_by:
    - riprap-q37t
---

- [x] Program, reconciler, ADR-0005, EVENT-MUTUAL §7/§12 moved together (spec wins rule)
- [x] No stray authority checks left behind (grep claim_payout call sites)
- [x] Codegen committed; changeset present

## Summary of Changes

- Confirmed in change `tpytmkvw` (riprap-20to): program constraint commented out per ADR-0005's prescribed path, reconciler mirror deleted, ADR-0005 amended (title/decision/consequences), EVENT-MUTUAL preamble + §6/§7/§12 reworded, codegen (claimPayout account docs) and changeset committed. Spec-wins rule honored: §7/§12 now state the permissionless crank.
- Stray sweep (this change, `uqvopovy` parent + this): fixed what the grep found — `programs/hanse/src/lib.rs` claim_payout doc still said "authority-gated for the pilot pass check"; `HanseError::Unauthorized` message still named "the pilot payout crank gate" (error.rs + codegen error maps regenerated); CLI build-test describe titles; `SETUP.BLADE-POOL.md` (lifecycle line, operator-key row, §9 Payouts section, §11 admin-gated note — the authority's only remaining power is subaccord param proposals); `launch-pools.sh` + `launch-pools-devnet.sh` header comments. Historical records (ADR-0005 past-tense bullets, ledger beans) intentionally untouched.
- Reconciler + all crank modules + CLI claim-payout command carry no authority logic; `Unauthorized` now fires only from `set_subaccord_param`.
- Verification: `anchor build --arch v2` + `@riprap/hanse` codegen (errors map diff), full `pnpm verify` exit 0 (17 green test-result lines; one CLI help-suite timeout flake under post-build load re-ran clean). Changeset: `.changeset/review-gate-retirement-strays.md` (patch, @riprap/hanse + @riprap/cli).
