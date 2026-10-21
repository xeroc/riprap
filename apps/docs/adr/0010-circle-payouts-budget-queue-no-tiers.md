---
status: accepted
---

# 0010 — Circle payouts: any-amount requests, epoch budget consumed at filing, queue for the rest — no tiers

Decided 2026-10-21 (design grilling, session consensus). The circle template
has no tier table: members request ANY amount, drawn-member jurors adjudicate
the amount against the circle's purpose, and the only on-chain bound is the
epoch budget — `max_payouts_per_epoch` — consumed at FILING. Approved
requests the current epoch's remaining budget cannot pay queue as obligations
into subsequent epochs, capped by the treasury.

## Why

- **Tiers are cover-template luggage.** A price/cap ladder fits a peril pool;
  it chokes a funding circle where asks are whatever the need is. The
  platform story ("any purpose") needs asks as open as purposes.
- **But the per-claim clamp was load-bearing**: in hanse, `max_payout` bounds
  what a filing reserves, which is what makes the exit base grief-resistant.
  Delete tiers with no replacement and one malicious filing reserves the
  whole treasury, starving every exit at the boundary for the length of an
  adjudication.
- **The budget IS the replacement** — if it is consumed at filing, not at
  payment. `reserve = min(requested, budget_remaining)` at filing; denial
  releases it. Budget and reserve become one mechanism with one release
  path: the epoch budget is a rate limit on payouts *by construction*, and
  the pending-slate subtraction from the exit base is bounded by the same
  number.

## Decision

- `file_request`: any amount; stores `requested`; reserves
  `min(requested, budget_remaining)`; claimant pre-pays juror fees (hanse
  pattern); entry credential must be valid AT filing.
- Approved requests pay `min(approved, budget_remaining)`; the remainder
  carries as an **obligation** into later epochs (FIFO at the boundary).
  Approved amount is sealed at approval; payment nets out the take at the
  payment-time rate (a ratcheted-down take favors the claimant, never hurts).
- **Obligations bind no more than the treasury holds** — the standing
  fail-closed law extended to the queue: at wind-down, unpaid approved
  requests scale pro-rata against the residue. Pacing is a promise; solvency
  never is.
- Grief economics: a filing costs prepaid juror fees and can reserve at most
  the epoch budget; the reserve-grief window is one adjudication. Membership
  is credential-gated (ADR-0011), so the circle's own roster is the first
  deterrent — no fee schedule on asks (pricing asks is underwriting, and we
  are not an insurer).

## Consequences

- Per-epoch worst case for a funder is exactly `share × budget` — a bounded
  rate of loss — plus the guaranteed boundary exit (ADR-0011). That is the
  product sentence: bounded rate, guaranteed leave.
- The budget is an immutable init parameter pinned by the pools directory
  (data law); fairness of WHO gets budget is adjudication policy (the def
  doc), never chain state.
