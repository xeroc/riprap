# Riprap — Project Rationale

> This document is the **why** and the **what**. The _how_ — pool accounting, depositor accounts, instructions, swig integration — lives in `meta/Pool Program.md` (design notes) and, once written, the program spec and ADRs.

## Why

Real insurance cannot sell small, short, specific protection. A three-day conference knife-assault policy has a premium smaller than an insurer's fixed costs — underwriting, reserves, a claims department, compliance — so nobody sells it. What exists instead: annual policies nobody buys for event risk, and event "protection" that is a sticker at a merch table.

Mutual aid is the oldest fix: peers pool money, qualifying losses get paid, whatever is left comes back. But a mutual of strangers needs two things the group doesn't have — a **treasurer everyone trusts**, and a **judge for subjective claims** ("was this actually a knife assault inside the covered area?"). Off-chain those roles mean an institution, which is exactly the fixed cost the premium can't carry.

On Solana, both blockers now have primitives:

- **Programmatic custody** — a pool program holding USDC with exactly two governed exit doors (spending, liquidation) and no discretionary signer.
- **Adjudication** — [Accord](../accord/PROJECT.md), the sister project: a Schelling-point arbitration oracle where randomly drawn, stake-weighted jurors rule on subjective questions, and voting coherently with the honest majority is the profitable strategy.

With disputes solvable and custody programmatic, an event-scoped mutual stops being an institution and becomes boring engineering: collect, adjudicate, disburse, dissolve.

## What

**Riprap** is a platform for **event-scoped mutual protection pools** — micro mutuals. One pool, one narrowly defined peril, one finite event:

- Members pay a **fixed entry fee** into a single pool and pick a coverage tier; the tier caps the maximum payout.
- A qualifying incident during the event → the member files a claim with evidence, and **jurors drawn from an Accord Subaccord adjudicate it**.
- Approved claims are paid from the pool. If approved claims exceed the pool, payouts scale down proportionally — the mutual can never pay more than it holds.
- When the claims window closes, **every unused cent returns to members pro-rata**, and the pool **dissolves permanently**.

No insurer, no reserve, no retained profit. The entry fee is the member's maximum contribution, not a sunk premium.

The name is the architecture: riprap is the armor on a breakwater's face — thousands of loose stones, no mortar. One stone is nothing; together they break any wave. Protection without a protector (`meta/naming.md`).

### Core mechanism (lifecycle)

```
1. Sponsor founds a mutual: peril definition, covered area, coverage window,
   tiers, claims window
2. Members join: entry fee → pool; member's account tracks the deposit and
   mints a rights stake (the right to claim)
3. (optional) Members opt in as jurors: stake into the mutual's claims
   Subaccord (draw pool = opted-in members of this mutual only), earn juror
   fees, unstake anytime
4. Incident: member files a claim + evidence, pre-pays the round-1 juror fees
5. Accord draws jurors → commit-reveal votes → ruling
6. Approved → payout policy installed into the pool treasury (swig
   TokenDestinationLimit); member claims the funds
   Rejected → claim closed, nothing moves
7. Claims window closes → a permissionless crank returns
   user_stake / total_stake × treasury to each member
8. Pool dissolves. Nothing survives.
```

### Key properties

- **Two doors out.** Money leaves a pool only via _spending_ (governed by the rights authority — adjudication) or _liquidation_ (governed by the ownership authority — e.g. a decision market). No third path, no discretionary signer (`meta/Pool Program.md`).
- **Three-track pool primitive.** Every pool carries ownership / rights / yield stakes, each with its own authority PDA. A micro mutual zeroes ownership and yield and uses rights only — but the same primitive decomposes ICOs (ownership), liquid staking (yield), and insurance (rights + ownership). Micro mutuals are the first, narrowest instantiation.
- **Claims are adjudicated, not judged.** The mutual never decides anything; it files a dispute with Accord via CPI and enforces the ruling. Riprap is an Arbitrable — the same two-call interface (`create_dispute`, `get_ruling`) as Canon and Synod.
- **Fail-closed economics.** Payouts are capped twice — by tier and by pool balance — and shortfall scales every payout down proportionally. The mutual cannot promise more than it holds, and holds nothing it wasn't paid.
- **Guaranteed death.** Dissolution is permissionless after the claims window: a crank pays out `user_stake / total_stake × treasury` per member. No permanent treasury, no retained profit, nothing left to capture.

### First instance — Micro Mutual: Knife Assault
The reference deployment: **Riprap: Blade Pool @ Breakpoint 2026** — a pool scoped to knife assault during the conference window (15–17 November 2026), in Olympia Convention Centre and its designated event area, London ([solana.com/breakpoint](https://solana.com/breakpoint)). Coverage opens with the conference and closes with the conference, per policy §2 (`meta/Breakpoint/Micro Mutual — Knife Assault - Policy.md`).

| Tier | Entry fee | Max payout |
| --- | --------: | ---------: |
| Basic | $10 | $1,000 |
| Standard | $20 | $2,000 |
| Premium | $40 | $4,000 |

Worked example: 1,000 Standard members → $20,000 pool → 4 approved claims at $2,000 ($8,000 paid) → $12,000 returned pro-rata ($12 per member) → dissolved. A member's worst case is $20; the pool's worst case is empty.

### What this is NOT

- Not an insurance company — no reserves, no underwriting beyond tier caps, no profit, no surviving entity.
- Not Accord — adjudication is the sister protocol's job; Riprap owns pooling and the claim lifecycle.
- Not a permanent treasury or DAO — every pool dissolves by design.

## Open questions

| # | Question | Status |
| --- | --- | --- |
| 1 | First event | **resolved** — Breakpoint 2026, 15–17 November 2026, Olympia Convention Centre, London; coverage window = the conference (policy §2); conference-side daily hours follow the published event schedule |
| 2 | Name | **resolved** — Riprap locked; Breakwater killed as runner-up. Domain: **riprap.xyz registered (primary)**; `riprap.io` not grabbed (optional). X: **@riprapxyz** (x.com/riprapxyz) (`meta/naming.md`) |
| 3 | Juror pool | **resolved** — members only: the draw pool is this mutual's opted-in members ($10 stake, unstakeable); no outside jurors |
| 4 | Copy register | **resolved** — deadpan-honest: state the peril plainly, never joke about it, never dramatize it; safety-engineering tone everywhere |
| 5 | Marketing scope | **resolved** — platform leads: Riprap is marketed as the event-scoped-mutual primitive; the knife-assault pool rides along as demo #1, not the hero |
| 6 | Instance naming | **resolved** — pattern `Riprap: {{PERIL}} Pool @ {{EVENT}}`; first instance: "Riprap: Blade Pool" (peril word stays precise in the policy doc) |
| 7 | Protocol take | **resolved** — zero for the first pool(s): prove the mechanism, no protocol cut; a take-rate on entry becomes a launch parameter once a second sponsor wants in |
