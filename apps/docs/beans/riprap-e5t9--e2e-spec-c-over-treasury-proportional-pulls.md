---
# riprap-e5t9
title: 'e2e spec c: over-treasury proportional pulls'
status: completed
type: task
tags:
    - ts
    - e2e
created_at: 2026-09-01T17:40:03Z
updated_at: 2026-09-01T17:40:03Z
parent: riprap-oaa8
blocked_by:
    - riprap-zuco
---

EVENT-MUTUAL §2.5/§8 exhausted path: approvals exceed treasury; settle_pool ratio < 1e9 matching hand math; TWO claimants pull in OPPOSITE orders and receive IDENTICAL proportional amounts (no landing-order lottery — the core §2.5 invariant); residual is dust only; burn saturation still zeroes paid claimants out of the residual.

Checklist:
- [x] spec green; order-independence asserted explicitly

## Summary of Changes

- `tests/src/spec-c-over-treasury.spec.ts` — the §2.5/§8 exhausted path on the shared mutual harness: two members file $95 claims (nonces 0/1), both panels vote Approve, both disputes settle Approved (obligations $190 + fee refunds $30 = $220 against the $200 treasury). `settle_pool` freezes ratio ⌊200M × 1e9 / 220M⌋ = 909_090_909 — asserted against constants derived by the same hand math the spec prints (EXPECTED_RATIO/EXPECTED_PAYOUT/DUST). The LATER filer pulls FIRST and the earlier second: both receive the identical ⌊95M·r/1e9⌋ + ⌊15M·r/1e9⌋ = 99_999_999 (per-term flooring, §7), asserted explicitly equal — the no-landing-order-lottery invariant. Treasury ends at exactly 2 units of dust; both paid claimants' depositor totals burn-saturate to 0 (out of the residual); both claims read Paid.
- Verification: fresh-surfnet jest 6/6 (spec c first-try pass, 45 s incl. cohort + two dispute drives); `anchor test --skip-build` exit 0 (6/6); offline skip clean under the tsc gate; full `pnpm verify` exit 0.
