---
# riprap-0zvk
title: 'e2e spec d: appeal ladder'
status: completed
type: task
tags:
    - ts
    - e2e
created_at: 2026-09-01T17:40:03Z
updated_at: 2026-09-01T17:40:03Z
parent: riprap-oaa8
blocked_by:
    - riprap-e5t9
---

EVENT-MUTUAL §7 + accord appeal: round resolved -> appeal (appellant posts new-round fee + bond) -> 7-panel redraw -> commit/reveal -> finalize. settle_claim reads the FINAL ruling; prior-round economics settle via settle_round crank; appeal bond refunded when flipped, forfeited when not — assert the correct branch. Juror count sufficient for the larger panel (stake enough distinct members).

Checklist:
- [x] spec green incl. settle_round + bond branch

## Summary of Changes

- `tests/src/draw-harness.ts` — round-aware draw: `resolveDistinctPanel`/`submitDraw` take `roundIdx` (panel size via `panelSizeForRound`: round 0 = 3, first appeal = 7), NEW `driveRound(fx, armed, votes, roundIdx)` granular composite that VRF-injects (idempotent against the once-frozen root) → draws → commit/reveal → finalize_round and returns `{roundPda, jurorStakeAccounts, memberships}`; `finalizeDisputeAfterAppealWindow` accepts extra remaining accounts (the appeal bond); `driveDisputeToFinal` recomposed on `driveRound`.
- `tests/src/mutual-harness.ts` — `MutualCohortOptions.nJurors` (stake more members for the larger appeal panel); `driveDispute` recomposed on `driveRound`.
- `tests/src/spec-d-appeal.spec.ts` — the ladder on a 12-member / 8-juror cohort: round 0 resolves Approve (2-1) → `appeal` custodies exactly cost.total = 14 × fee_per_juror = $70 (bond $35) appellant → fee vault, asserted on both balances → round 1 redraws the 7-panel and FLIPS to Deny (4-3) → appeal-window warp → `finalize_dispute` with the bond as a remaining account → `settle_round` crank releases round-0 economics against the FINAL ruling → `claim_appeal_refund` returns the FLIPPED bond in full (the correct branch; no-flip forfeit is LiteSVM-covered), a second claim reverts with no balance movement → `settle_claim` reads the FINAL ruling ⇒ the claim is Denied with obligations 0 despite round-0 Approve; net appellant cost = the new-round fee only.
- Verification: fresh-surfnet jest 7/7 (spec d 29 s incl. 12-member cohort + two rounds); `anchor test --skip-build` exit 0 (7/7); offline skip clean under the tsc gate; full `pnpm verify` exit 0.
