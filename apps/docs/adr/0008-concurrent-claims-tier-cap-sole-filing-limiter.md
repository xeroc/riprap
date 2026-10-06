# ADR-0008: Concurrent claims — the tier cap is the sole filing limiter

- **Status:** accepted (2026-10-05)
- **Context:** EVENT-MUTUAL multi-claim amendment 2026-10-05; supersedes the
  one-Pending-claim serialization (§2.4/§6/§7, amendments 2026-09-01) and the
  `rights_stake > 0` filing gate.
- **Affected:** `programs/hanse` (file_claim, settle_claim, join, state, errors),
  `@riprap/hanse` SDK, `apps/cli`, `apps/landing` (wizard preflight + amount step),
  e2e gate matrix.

## Context

v1 serialized filings: a member could hold one Pending claim
(`Member.has_pending_claim`, set at `file_claim`, cleared at `settle_claim`),
and `file_claim` additionally required `depositor.rights_stake > 0`. The pilot's
product shape is chunked claiming — a member pays the tier contribution
(e.g. $100) and claims against the tier cap (e.g. $1,000) in multiple
incidents over the event window. Two gates block that shape:

1. The serialization gate forces file → adjudicate (~3d/round) → settle → refile
   for every chunk.
2. The stake gate locks a member out at **contribution-worth of paid-out
   claims, not cap-worth**: each payout burns `min(payout, total_amount)` of
   residual weight, saturating at the contribution. With $50 chunks + ~$20 fee
   riding each payout, a $100 contributor is `NoRightsStake`-locked after two
   chunks with $900 of cap unreachable.

The 2026-09-24 audit H-1 fix already moved the real protection: `cap_used`
reserves the Σ of Pending + Approved claim amounts per membership at filing
and releases on Denied/Failed — per-membership, timing-safe, adjudication-aware.
After H-1, both removed gates were redundant for solvency: obligations are an
aggregate, the ratio is frozen once at `settle_pool`, payouts are idempotent
per Claim PDA, and burn saturates so no paid claimant over-drains stake.

## Decision

1. **Delete the serialization gate.** Members file claims concurrently. The
   cumulative tier cap is the only filing limiter:
   `file_claim` stores `min(requested, max_payout − cap_used)` and reverts
   `TierCapExhausted` at zero remaining. Each filing increments `cap_used`
   before the next can read the remainder, so N concurrent filings can never
   exceed the cap — H-1's invariant, unchanged.
2. **Delete the `rights_stake > 0` gate and the depositor account from
   `file_claim`.** `rights_stake` is the pool's **residual-weight** measure,
   never claim allowance. Reading it as cover confused two ledgers that track
   different events with different timing (residual weight burns at payout and
   never returns; cover reserves at filing and releases on denial). Burn
   semantics, residual mechanics, and the §8 worked numbers are unchanged.
3. **Delete `Member.has_pending_claim`** (account shrinks 1 byte; v1 is
   localnet/LiteSVM-only, no live accounts to migrate) and the error variants
   `PendingClaimExists`, `NoRightsStake` (error codes after `NotMember` shift
   down two — re-pinned in the e2e gate matrix).

## Consequences

- **Ledger separation is now strict:** pool = capital (residual weight), hanse
  = promises (cover remaining). No instruction cross-reads them. The spec §3
  "Rights stake" definition drops "the right to file a claim" — the
  single-claim design had let one number double-mean both, and multi-claim
  forced the split.
- **Dispute burst rate:** serial refiling was rate-limited by adjudication
  time; a member can now open N disputes at once. The filing fee
  ((min_jury_size + 1) × fee_per_juror, claimant-funded, kept on denial) is
  linear per dispute, so burst filing is economics-bounded, not free.
- **Wizard/CLI surfaces** gate and display the *remaining* cap
  (`max_payout − cap_used`): the preflight's `claim-open` and
  `no-rights-stake` blocks collapse into one `cap-exhausted` block; the amount
  step defaults and clamps to the remainder.
- **Tokenization seam preserved:** §11's future SPL wrapping of ledger stake
  wraps a capital share. Had `rights_stake` been re-seeded as max_payout
  (considered and rejected in grilling), the seam would wrap a personal,
  non-transferable promise — and reservation-on-filing would have required a
  pool-side "unburn", breaking `stake = amount × rate` for one consumer.

## Considered and rejected

- **`rights_stake = max_payout` at join (rate = leverage):** cannot reserve at
  filing (40 × $50 pending against 1000 stake over-files; H-1 reopens), needs
  an unburn to release on denial, burns claim+fee (smearing the cap), couples
  the per-pool rate to per-member tier leverage, and poisons the
  tokenization seam.
- **Freeze stake until cap exhausted, then zero it:** the trigger is untracked
  (needs a third ledger `paid_total`) and ill-defined under the settlement
  ratio (at ratio < 1 the cap is *never* fully withdrawn — the designed
  over-treasury case would leave stake at its deposit value forever).
- **Keep the fields, stop reading them:** dead ledger bytes and a stale spec
  definition inviting the next reader into the same double meaning.
