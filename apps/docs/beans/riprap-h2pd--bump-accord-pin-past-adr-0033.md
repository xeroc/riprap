# riprap-h2pd
title: Bump the accord pin past the ADR-0033 release (H-2 close-out at the source)
status: open
type: task
priority: high
created_at: 2026-09-25T00:00:00Z
updated_at: 2026-09-25T00:00:00Z
parent:
blocked_by:
---

## Why

The 2026-09-24 security audit found H-2 (High): `settle_claim`'s Failed branch
transferred the filing-time `claim.fee_paid` out of the shared fee float, but
the pinned accord (`ba91bd8`) decrements `dispute.fee_paid` by round-0
participation before any Failed refund — a resolve-then-fail dispute left the
float short, the settle reverted, and the mutual bricked (all funds locked).

Two-sided fix landed 2026-09-25:

- **riprap side (done, works under the current pin):** Failed fees ride the
  settlement ratio — `settle_claim` books `fee_refunds` and moves no funds,
  `settle_pool` sweeps the float into the treasury before freezing the ratio,
  `claim_payout` accepts Failed claims (fee-only). Hanse no longer measures
  accord's refund at all.
- **accord side (done on develop, commit "feat(accord): Failed path pays no
  participation — no ruling, no pay (ADR-0033)"):** the Failed path pays zero
  participation, so the filer refund is exactly the filing-time tender and
  appeal bonds refund whole.

## Task

When the accord release carrying ADR-0033 is cut, bump `programs/hanse/Cargo.toml`
`rev` to it and re-verify the pin-bump contract:

1. `filing_fee()` shape vs hanse's `min_jury_size × fee_per_juror` tender
   (develop books `(J+1)·fpj` tender split into `fee_paid` + bounty unit —
   confirm the `create_dispute` CPI `fee` argument still matches, or hanse
   fails `FeeMismatch` at runtime).
2. `DisputeState` terminality set: hanse handles `Final | Failed`; accord's
   `Closed` must still be unwritten, else add it to `settle_claim`'s match
   (audit X-2 / hanse L-1 — the freeze cascade).
3. Failed-refund exactness: drive the REAL cancel/redraw path in the e2e and
   assert the float receives exactly `claim.fee_paid` per failed claim
   (post-ADR-0033 this must hold mechanically — the test pins it).
4. ADR-0030 bounty: filing tender includes the filer's bounty unit; if hanse
   ever books "made whole on filing costs", book `fee_paid + fpj`.
5. Rebuild the sibling (`make build`) + `ACCORD_SO` v1 artifact for the
   LiteSVM lane (`anchor build --arch v1` for pool/hanse), full
   `pnpm verify`, and the live e2e (`anchor test`).

Reports: `meta/security-reports/` (hanse-audit.md H-2 + post-audit
re-evaluations; cross-program-audit.md addendum).
