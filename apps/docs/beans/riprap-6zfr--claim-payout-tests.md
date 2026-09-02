---
# riprap-6zfr
title: claim_payout + tests
status: completed
type: task
tags:
    - rust
    - tdd
created_at: 2026-09-01T17:39:27Z
updated_at: 2026-09-02T07:05:00Z
parent: riprap-ggsd
blocked_by:
    - riprap-77ty
    - riprap-609b
---

EVENT-MUTUAL §2.4/§7 + §8 numbers. Claimant pull, idempotent.
Gates: phase Settled, now < pull_close_at, status Approved, co-signature of Mutual.authority (Breakpoint pass gate — spec §2.10 amendment / §12; passes verified off-chain, gate sits at payout).
payout = claim_amount x ratio_1e9 / 1e9 + fee_paid x ratio_1e9 / 1e9 (u128 intermediates, floor).
Atomic in one tx: CPI pool::spend(payout) to claimant ATA — rights authority [mutual_auth, mutual] invoke_signed; CPI pool::burn(Rights, depositor, min(payout, depositor.total_amount)) — saturates at contribution. status = Paid.

Tests: §8 solvent (2_015_000_000 units = 2,000 + 15 fee at ratio 1e9), §8 exhausted (ratio 661_665_700-ish per §8: 1,323.40 + 9.93 — exact integer base units, floor documented), missing authority co-sign reverts, pull after pull_close_at reverts, double pull reverts, burn saturates (depositor total -> 0), destination ATA is claimant-owned.

Checklist:
- [x] red then green; §8 rows cite the worked example

## Summary of Changes

- `instructions/claim_payout.rs`: gates — phase Settled (constraint), pull window `now < pull_close_at`, authority co-sign (require_keys_eq vs Mutual.authority — Breakpoint pass gate §2.10/§12), claim binding (mutual + member == claimant), idempotence first (Paid → ClaimAlreadyPaid via an Approved|Paid constraint + handler gate so re-pulls get the precise error). Depositor/treasury PDAs verified in handler.
- payout = floor(claim_amount × ratio/1e9) + floor(fee_paid × ratio/1e9) — u128 checked, TWO floors per §7. Atomic: CPI `pool::spend(payout)` then CPI `pool::burn(Rights, min(payout, depositor.total_amount))` — both signed by the [mutual_auth, mutual] PDA, which is a seeds-verified UncheckedAccount in the context (an AccountInfo's pubkey cannot be relabeled). status = Paid, PayoutClaimed emitted.
- §8 rows (worked example cited in asserts): solvent — claimant pulls exactly 2_015_000_000 ($2,000 + $15 fee at ratio 1e9) and rights stake burns to 0 (saturation at the $20 contribution, 40× under the payout); exhausted — 15 × $2,000 + 15 × $15 vs a $20,000 treasury (minted to §8 scale, modeled as 15 joined claimants + top-up for the other 985 members): ratio = 661_703_887 exactly (bean's "661_665_700-ish" was approximate; the exact floor is 20e9×1e9/30_225_000_000 = 661_703_887, consistent with §8's "≈ 0.6617"), claim part 1_323_407_774 ($1,323.40) + fee part 9_925_558 ($9.93) — every claimant identically.
- Tests: 6/6 — the two §8 rows, missing co-sign (Unauthorized), pull-after-window (PullWindowClosed), double pull (ClaimAlreadyPaid), foreign destination ATA (associated-token constraint rejects).
- Setup note: §8 economics need fee_per_juror $5 — tests drive the full real lifecycle on a custom config (fresh seed 7). clippy 0; `pnpm verify` exit 0.
