---
# riprap-zuco
title: 'e2e spec b: denied claim'
status: completed
type: task
tags:
    - ts
    - e2e
created_at: 2026-09-01T17:40:02Z
updated_at: 2026-09-01T17:40:02Z
parent: riprap-oaa8
blocked_by:
    - riprap-efdw
---

Full voting to Deny (majority commit/reveal for the deny option): settle_claim -> Denied; juror fee stays with jurors (fees_earned/fee vault side, NO refund to claimant); member keeps full residual share via crank; no pool spend/burn happened. Assert counters, statuses, balances.

Checklist:
- [x] spec green

## Summary of Changes

- `tests/src/mutual-harness.ts` — NEW shared cohort fixture extracted from spec-a's scaffolding for the remaining specs: `setupMutualCohort` (initialize_mutual with pilot tiers + short windows + TS-side `subaccord_domain_ref` hashing, uniform-tier joins, last-3-members juror staking at tier contribution §12), `fileMemberClaim` (fee funding, live claim_nonce, Claim/Dispute PDA derivation, file_claim; the result structurally extends the draw-harness `ArmedDispute`), and `driveDispute` (VRF injection → panel draw → commit/reveal of caller votes → finalize_round → appeal-window warp → finalize_dispute). Money asserts stay in the specs.
- `tests/src/spec-a-solvent.spec.ts` — refactored onto the mutual harness (same asserts, ~40 % smaller).
- `tests/src/spec-b-denied.spec.ts` — full voting to Deny: ruling 1 → `settle_claim` Denied with obligations 0 / fee_refunds 0 (fee stays with the jurors — no refund path ever runs); claimant ATA stays 0 through settlement; treasury untouched by the dispute; claimant depositor unburned; `settle_pool` ratio 1e9 on the empty denominator; dissolve; all 10 members (claimant included) crank exactly $20 each; treasury → $0 and the claimant ends with exactly their residual share.
- Verification: fresh-surfnet jest 5/5 (spec b 46 s incl. cohort setup); `anchor test --skip-build` exit 0 (5/5, spec b 8.8 s); offline `pnpm --filter @riprap/tests test` skip-clean under the tsc gate; full `pnpm verify` exit 0.
