---
status: accepted
---

# 0011 — Circle custody & accounting law: flat money-weighted, honest exit base, credentials gate in never out, take on payouts only

Decided 2026-10-21 (design grilling, session consensus). The circle rides the
pool's deployed money-weighted accounting unchanged and adds four custody
laws that make an undying pool safe to fund and safe to leave.

## Why

Ongoing pools interleave deposits, payouts, and exits in one living fund,
which forces every classic fund-accounting question. The alternative —
NAV/unit (4626-style) accounting where deposits buy credit at
`total/treasury` — was considered and rejected: it seals each cohort's losses
(late joiners absorb none, rescue none), which makes the pool a ladder of
closed-end funds rather than a mutual, and it rewrites share math into the
deployed pool.

## Decision

- **Flat money-weighted (the deployed law) carries over.** A contribution
  credits total 1:1. The **recovery ratio** `treasury / total_amount` is the
  only loss carrier: requests lower it, contributions raise it, exits never
  move it. The implied cost of joining late is the gap between the
  contribution and its recoverable share — expressed ONLY as the ratio; no
  price list, and "premium" is a banned word (CONTEXT.md).
- **Exit intents settle at the first boundary ≥ the member's paid cover end,
  against the exit base `treasury − Σ reserves − Σ obligations`.** Never
  delayed by anything; never more than one epoch's wait; never allowed to
  outrank money the pool already owes. Exits are ratio-neutral and the
  boundary waterfall is order-independent.
- **Credentials gate money in and asks — never money out.** An external
  entry credential (SAS attestation pinned at init, ADR-0004 pattern) gates
  join, renew, and file; the circle mints its own juror credential (hanse
  §2.8 pattern). Exit settlement and payment of obligations are
  credential-free — ejection must never become confiscation. Renewal
  re-verifies, so ejection = cannot renew = graceful departure, capital
  intact.
- **The take rides adjudicated value only.** `take_bps` is set at init,
  operator-reducible, NEVER increasable (on-chain ratchet). It is taken
  off-the-top of each adjudicated payout; the protocol's share
  (`protocol_bps`, a program constant) is a fraction of the operator's take.
  Contributions, the float, and exits are take-free, forever. No fee on the
  float; float yield belongs to the pool's Yield track as a separate future
  product, never the circle's treasury.

## Consequences

- "Every cent back" generalizes to: capital out is bounded only by what
  requests already took or owe — computable on-chain at any instant from
  treasury, reserves, and obligations.
- A funder's worst case per epoch is `share × budget`; leaving costs at most
  waiting out the paid epoch. The cover credibility of an ongoing pool rests
  on the exit base subtraction — remove it and flight-before-ruling drains
  the pot the queue is waiting for.
