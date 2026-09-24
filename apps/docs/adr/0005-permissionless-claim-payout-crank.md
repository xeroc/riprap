---
status: accepted
---

# 0005 — `claim_payout` is a permissionless payout crank (authority-gated for the pilot)

Decided 2026-09-24, amending EVENT-MUTUAL §7/§2.10/§12 (the 2026-08-31 two-signer co-sign model). The payout math is untouched — only the signer model changes.

## Why

The claimant signature was pure ceremony: every value the payout depends on is bound by on-chain state — the destination is the claimant's canonical ATA (`associated_token::authority = claimant`), the position by `claim.member` + the `["depositor", pool, member]` PDA, the amount by the frozen ratio, and double-pulls by the `Approved → Paid` status flip (`ClaimAlreadyPaid`). Meanwhile the signature carried real costs:

- **Operational**: the member had to sign, so the operator could never sweep payouts — with `#/app` reads-only in v1 there was no member-side pull surface at all; every payout needed the member to run a CLI with the admin key mounted.
- **CLI model**: `hanse:claim-payout` was the CLI's only two-signer exception (`--co-signer`), a wart on the single-signer design.

## Decision

- **One signer: the cranker.** `claim_payout` follows the `pool::crank` pattern — the cranker pays fees and gains nothing; the payout lands in the claimant's canonical ATA whoever turns the crank. The claimant is an `UncheckedAccount` bound by `claim.member` (plus the depositor PDA check in the handler). Cranking someone else's claim pays that someone, never the cranker.
- **The pilot pass gate is ONE account constraint**: `cranker.key() == mutual.authority @ Unauthorized`. Breakpoint passes are verified off-chain (§2.10), so the gate sits at payout — comment the constraint out when the pass check retires and anyone may crank. No config knob: a mutable security gate would be worse than a commented line.
- **CLI drops `--co-signer`** — single-signer everywhere; the operator wallet (the mutual authority) sweeps approved claims.

## Consequences

- Payout liveness no longer depends on the claimant being online; the operator (or anyone, post-pilot) cranks. No trust change: the authority already co-signed every pull under the old model, so member-alone self-service never existed.
- The member's deposit-mint ATA must pre-exist (it was created at `join`); if a member closed it, the crank reverts until someone recreates it — one operator runbook line, not a code change.
- Account order in the IDL changed (`cranker`, `claimant`, …) — Codama client regenerated; every call site (CLI, e2e specs, LiteSVM) updated in the same change.
- Toolchain note (discovered during verification): litesvm 0.10's `program_runtime_v1` verifier rejects SBFv3 ELFs (`Instruction(InvalidAccountData)`), and anchor ≥1.2 defaults to `--arch v3` — `pnpm verify` now pins `anchor build --arch v2`, and the sibling accord artifact must be built from the pinned rev the same way (the sibling checkout on `develop` emits v3).
