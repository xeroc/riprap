---
# riprap-c448
title: 'e2e spec e: lifecycle gates and idempotence'
status: completed
type: task
tags:
    - ts
    - e2e
created_at: 2026-09-01T17:40:03Z
updated_at: 2026-09-01T17:40:03Z
parent: riprap-oaa8
blocked_by:
    - riprap-0zvk
---

Gate matrix against the live mutual:
- join after deposits_close_at reverts (warp)
- file_claim after claims_close_at reverts
- claim_payout WITHOUT authority co-sign reverts
- claim_payout after pull_close_at reverts (unpulled amount reverts to residual)
- double claim_payout reverts (status Paid)
- settle_pool with a pending claim reverts
- dissolve before pull_close_at reverts
Finish with the full @riprap/tests suite green serially on one Surfpool (global clock caveat respected).

Checklist:
- [x] spec green
- [x] whole suite green in one anchor test run

## Summary of Changes

- `tests/src/spec-e-gates.spec.ts` — the full gate matrix, each revert asserted against its exact anchor error code (kit nests "Custom program error: #NNNN" in the cause chain; `expectRevert` walks it): join after deposits_close_at → 6001, file_claim after claims_close_at → 6016, settle_pool with a pending claim → 6023, claim_payout without the authority co-sign (a funded stranger signs) → 6030, double payout → 6029, payout past pull_close_at → 6026 (claim B stranded Approved-and-unpaid, its amount provably still in the treasury — reverted to the residual), dissolve before pull_close_at → 6027, then dissolve succeeds to Dissolved. Two cohorts: a small 4-member one for the window gates, a 10-member/two-claim one driven through settle for the payout gates.
- `tests/src/mutual-harness.ts` — cohort seed now ns-unique (`Date.now()` × 1e6 + hrtime remainder): a ms-only seed collided once across back-to-back runs (PDA-in-use flake, observed once, fixed at the root).
- Verification: `anchor test --skip-build` exit 0 — the WHOLE @riprap/tests suite (9 tests: harness, draw-harness smoke, specs a–e) green serially on one fresh Surfpool in ~53 s; offline `pnpm --filter @riprap/tests test` skip-clean under the tsc gate; full `pnpm verify` exit 0.
