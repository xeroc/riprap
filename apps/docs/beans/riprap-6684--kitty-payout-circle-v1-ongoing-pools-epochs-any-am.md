---
# riprap-6684
title: 'kitty — payout-circle v1: ongoing pools, epochs, any-amount adjudicated payouts (programs/kitty + SDK + CLI + cranker + landing + e2e)'
status: todo
type: milestone
priority: high
tags:
    - program
    - anchor
    - rust
created_at: 2026-10-21T10:40:39Z
updated_at: 2026-10-21T10:41:41Z
---

Second purpose-pool template per meta/specs/PAYOUT-CIRCLE.md (grilled consensus 2026-10-21) + ADR-0009/0010/0011. Program `kitty`, domain word `circle` (hanse/mutual precedent).

Locked decisions:
- Recurrence = subscription, ongoing pools only; manual push (`renew`); finite event pools (hanse) stay one-shot forever, byte-frozen through Breakpoint.
- Payment = capital + rights-renewal: lapse kills rights, capital survives; renewal forward-only `max(now, cover_until) + epoch`.
- Accounting = flat money-weighted (deployed pool law): recovery ratio treasury/total_amount is the only loss carrier; no NAV, no tiers, "premium" banned (CONTEXT.md).
- Epochs: immutable init `epoch_len` validated 1d–365d; join full-price through end of NEXT epoch; `advance_epoch` permissionless + idempotent.
- Requests: any amount, jurors adjudicate the amount; `budget_per_epoch` consumed AT FILING (reserve = min(requested, budget_remaining), released on denial); approved-over-budget queues as obligation, FIFO; obligations bind ≤ treasury; wind-down scales unpaid pro-rata.
- Exits: intent field on Member; settles at first boundary ≥ cover_until against exit base = treasury − Σ reserves − Σ obligations; ratio-neutral; order-independent waterfall; never delayed, never credential-gated.
- Credentials: external entry SAS gates join/renew/file; internal juror SAS gates the draw circle (hanse §2.8); never gate money out.
- Economics: take on adjudicated payouts only, off the top; `take_bps` init + on-chain ratchet-down; `protocol_bps` = program constant, cut of the OPERATOR's take; contributions/float/exits take-free; no float yield (Yield track is a separate future product).
- Pool program gains exactly ONE instruction: `exit_depositor` (ownership-authority gated, ratio-neutral) — ships post-pilot.

House law: TDD red first, lint law zero errors, one file per instruction, u128 checked intermediates, no unwrap on user paths, provenance comments citing spec §.

## HANDOFF

### 1. Happy Path

1. Operator `initialize_circle`: create pool (rights/ownership authorities = circle PDAs), subaccord, juror credential, pin external entry credential + policy_hash + contribution/budget_per_epoch/epoch_len/take_bps.
2. Member `join` (entry credential verified): contribution → pool deposit; `cover_until = end of NEXT epoch`; juror credential minted.
3. Member `renew` before/at expiry: `cover_until = max(now, cover_until) + epoch_len`; credential re-verified.
4. Member `file_request` (credential valid at filing): any amount; reserve = min(requested, budget_remaining); juror fees prepaid; Accord dispute CPI.
5. Jurors (this circle's staked members) rule; `settle_request` (permissionless): Denied → reserve + fees released; Approved → obligation.
6. `pay_request` (permissionless): pay min(obligation, budget_remaining); take off the top (claimant nets P×(1−take_bps), operator P×take_bps, protocol its share of operator take); remainder re-queues FIFO.
7. `advance_epoch` (permissionless, idempotent): carry obligations, snapshot exit base, refresh budget, settle exit intents at/below this boundary.
8. Member `request_exit` anytime (credential-free): `settle_exit` pays contributed_total/total_amount × exit_base via pool `exit_depositor` CPI; member closed.

### 2. Data Contract

- Accounts: Circle (PDA ["circle", seed]), Member (["member", circle, member], carries cover_until + exit intent — no separate ExitIntent account), Request (["request", circle, nonce]).
- Instructions: initialize_circle, join, renew, file_request, settle_request, pay_request, set_take_bps, request_exit, settle_exit, advance_epoch.
- SDK: packages/kitty → @riprap/kitty (Codama codegen + pdas.ts/fetch.ts facade, hanse pattern); fetchCircles scan.
- CLI: riprap kitty:* topic (single-signer; README matrix same change).
- Cranker: advance_epoch / settle_request / pay_request / settle_exit modules + reconciler decision matrix.
- Landing: store two-arm union (hanse mutual | kitty circle), def doc grows template + entry-credential fields.

### 3. Edge Cases & Constraints

- Renewal NEVER retroactive over a gap; join mid-epoch = full price, covered through end of NEXT epoch.
- epoch_len validated 1d–365d at init (PULL_WINDOW lesson: no unbounded operator clocks).
- Credentials gate money IN and asks (join/renew/file) — NEVER money out (settle_exit, pay_request credential-free).
- set_take_bps: on-chain ratchet new ≤ old, never upward; payment-time rate; a reduced take favors the claimant.
- Obligations bind ≤ treasury; wind-down scales unpaid pro-rata (fail-closed to the queue).
- Exits settle against treasury − Σ reserves − Σ obligations; pending requests reduce the base, never delay the exit.
- Take NEVER on contributions, float, or exits. No float yield — treasury never touches DeFi.
- Incident filed after ejection is dead (credential valid at FILING) — recorded, deliberate.
- pool program: ONLY exit_depositor, ships after Breakpoint 2026. hanse: zero changes.
- Vocabulary: "premium" banned everywhere; platform copy says purpose pools; "circle" names the template.

### 4. Business Logic (pseudo-code)

```
reserve(r)      = min(r.requested, circle.budget_remaining)   // at filing
take(P)         = P * take_bps; claimant_net = P − take
exit_base       = treasury − Σ reserves − Σ obligations
exit_share(m)   = m.contributed_total / circle.total_amount × exit_base   // ratio-neutral
renew(m)        : m.cover_until = max(now, m.cover_until) + epoch_len
funder worst case per epoch = (m.contributed_total / total_amount) × budget_per_epoch
```

### 5. Definition of Done

- [ ] LiteSVM lifecycle suite green (join/renew/file/approve/pay/queue/exit, reserve release, wind-down pro-rata)
- [ ] Reconciler decision matrix mirrors every on-chain gate (one change)
- [ ] `pnpm -r run build && pnpm lint && pnpm -r run test` green; full `pnpm verify` for the program legs
- [ ] jest e2e on Surfpool: solvent lifecycle to the cent; denied; over-budget queue; exit base math
- [ ] AGENTS.md Parts table + propagation edges updated; CLI README complete (suite.test.ts green)
- [ ] Changeset present; no edits to hanse; pool diff = exit_depositor only
- [ ] Final review against meta/specs/PAYOUT-CIRCLE.md

### 6. Test Matrix (Given / When / Then)

- Given member with cover_until past, When renew, Then cover extends from old expiry (not now); given lapsed gap, Then new cover starts at payment, never retroactive.
- Given pending request with reserve, When member exits at boundary, Then payout = share of (treasury − reserves − obligations), same epoch, no delay.
- Given approved request > remaining budget, When paid, Then partial pay + obligation re-queues FIFO; treasury never overdrawn.
- Given take_bps reduced after approval, When paid, Then claimant nets at new rate (favors claimant).
- Given ejection (credential revoked), When renew/file, Then revert; When settle_exit, Then pays in full.
- Given advance_epoch called twice for same boundary, Then second is a no-op (idempotent).
- Given obligations > treasury at wind-down, Then unpaid scale pro-rata against residue.

### 7. Open Questions

- Entry-credential issuer tooling for first circles (default: founder-issued SAS, CLI-minted).
- Juror stake surface: default reuse hanse member-stake pattern.
- Partially-paid obligations in FIFO: default yes, remainder re-queues at tail.
- Wind-down trigger: default collective (ownership authority) only; automatic last-member-out later.
See PAYOUT-CIRCLE.md §11.
