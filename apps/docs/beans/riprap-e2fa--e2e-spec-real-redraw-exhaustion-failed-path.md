# riprap-e2fa
title: e2e spec — real redraw-exhaustion Failed path asserts float refund exactness
status: open
type: task
priority: low
created_at: 2026-10-25T00:00:00Z
parent: riprap-h2pd
---

## Why

The accord pin bump to `25c48b28` (riprap-h2pd close-out) re-verified the
Failed-refund contract at the source level: at that rev `cancel_dispute`
refunds `dispute.fee_paid + bounty_pool` (the full filing tender) and zeroes
both, `create_dispute` enforces `delta == fee` custody, and `fee_paid` is
never decremented before a refund (ADR-0033 "no ruling, no pay"). The LiteSVM
regressions from the H-2 fix (`failed_books_fee_refund_and_moves_no_funds`,
`failed_fee_float_swept_into_treasury_before_ratio`,
`failed_claim_pays_fee_only_at_ratio`) pin hanse's ratio-path against a
planted SHORT refund — but no test drives a dispute to `Failed` through the
REAL accord instructions (stall → redraw exhaustion).

Residual risk if the binary ever diverges from source: proportional payout
drift only, not a brick — `settle_pool` computes the ratio AFTER sweeping
whatever the float actually holds, so a short refund lowers everyone's ratio
rather than reverting. That is why this is low priority.

## Task

- Extend the jest draw harness (`tests/src/draw-harness.ts`) with a
  reveal-stall → redraw-exhaustion path (no reveals → warp past the redraw
  window → redraw crank × `maxDrawAttempts`), or add the equivalent real-CPI
  machinery to the Rust LiteSVM harness.
- New spec: file a claim, drive the dispute to `Failed` for real, assert the
  fee float received exactly `claim.fee_paid` (full tender incl. the
  ADR-0030 bounty unit), then settle_claim → settle_pool → claim_payout
  (fee-only) end to end.

## Acceptance

- The spec passes live (`anchor test`) against `tests/deps/accord.so` built
  from the pinned rev.
- The float-exactness assertion fails if the deployed accord binary refunds
  anything other than the full tender.
