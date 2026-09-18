---
status: accepted
---

# 0002 — MVP restrictions from the 2026-09-18 security review: single mint, fixed 180-day pull window, classic SPL only

The 2026-09-18 mainnet-readiness review found no authorization bypass, but two configuration surfaces could produce incorrect or stranded money, and one token-program assumption was implicit. All three are now enforced on-chain in `initialize_mutual` rather than left to operator discipline.

## Decisions

- **`deposit_mint == fee_mint`** (rejected at init with `InvalidConfiguration`). Settlement adds claim (deposit-mint) and fee (fee-mint) amounts as raw integers into one obligation denominator, and `claim_payout` transfers the sum from the deposit-token treasury — mixed mints would pay fee-mint units out of the deposit treasury (over- or under-payment depending on decimals). Separate-asset settlement needs its own ledgers plus an explicit conversion; not an MVP problem.
- **`pull_window` removed from `InitializeMutualConfig`**; hardcoded `PULL_WINDOW_SECS = 180 × 86_400` (six 30-day months) in `programs/hanse/src/state.rs`, written to `Mutual.pull_window` at init. Init previously accepted any positive i64; `settle_pool` computes `now.checked_add(pull_window)`, so `i64::MAX` overflowed every settlement attempt — payout and dissolve both require `Settled`, stranding deposits in `Active` forever. A fixed constant removes the input, not just the overflow.
- **Classic SPL Token only, stated** — the programs use `anchor_spl::token::Token` and classic Mint/TokenAccount constraints throughout; Token-2022 mints are rejected by construction. Documented in the README and CLI help instead of silently assumed.

## Considered options

- **Bound the window instead of fixing it** (`0 < pull_window ≤ MAX`) — smallest diff, but keeps a per-mutual knob nothing needs; the pilot (§12) is the only planned deployment and 180d covers it with margin.
- **Keep both mints with a runtime conversion** — reopens the exact accounting bug class the review flagged; deferred until a two-asset product exists.

## Consequences & migration

- `initialize_mutual` loses the `pull_window` argument: IDL, generated client, CLI (`riprap hanse:initialize` `--pull-window` flag removed), the TS harness, and the LiteSVM suites all shrank accordingly; `Mutual.pull_window` stays as an account field (introspection + unchanged `settle_pool` logic).
- §12 pilot deadline sanity moves out six months (settle ≈ Dec 16 → pulls close ≈ 2027-06-14) — strictly more margin for late appeals.
- Two-asset settlement or a configurable window, if ever wanted, is a new settlement design with its own spec amendment — not a revert of this ADR.

This ADR + `meta/specs/EVENT-MUTUAL.md` amendments (2026-09-18) are the record.
