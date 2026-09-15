# Riprap — Project Rationale

> This document is the **why** and the **what**. The _how_ — pool accounting, depositor accounts, instructions, swig integration — lives in `meta/Pool Program.md` (design notes) and, once written, the program spec and ADRs.

## Why

Real insurance cannot sell small, new, or narrow protection. A three-day conference knife-assault policy, a protocol's exploit cover, a workshop covering its members' tools — each premium is smaller than an insurer's fixed costs — underwriting, reserves, a claims department, compliance — so nobody sells it. What exists instead: annual policies nobody buys for risks like these.

Mutual aid is the oldest fix: peers pool money, qualifying losses get paid, whatever is left comes back. But a mutual of strangers needs two things the group doesn't have — a **treasurer everyone trusts**, and a **judge for subjective claims** ("was this actually a knife assault inside the covered area?"). Off-chain those roles mean an institution, which is exactly the fixed cost the premium can't carry.

On Solana, both blockers now have primitives:

- **Programmatic custody** — a pool program holding USDC with exactly two governed exit doors (spending, liquidation) and no discretionary signer.
- **Adjudication** — [Accord](../accord/PROJECT.md), the sister project: a Schelling-point arbitration oracle where randomly drawn, stake-weighted jurors rule on subjective questions, and voting coherently with the honest majority is the profitable strategy.

With disputes solvable and custody programmatic, a mutual stops being an institution and becomes boring engineering: collect, adjudicate, disburse — and end on terms the members set.

## What

**Riprap** is a protocol for **mutuals on Solana** — permissionless protection pools (scope corrected 2026-09-15: the platform is not event-bound; events are the pilot's shape):

- **Anyone can create a mutual** — a transaction, not a company formation; no permission to ask.
- **Any terms** — any entry amount, any number of members, any risk the group mutually wants to share. Policy content is the founder's to define; the protocol imposes no template.
- Members fund the pool (v1: a fixed entry fee; roadmap: recurring contributions that keep membership alive).
- A qualifying event → a claim with evidence → **jurors drawn from an Accord Subaccord adjudicate it**; approved claims are paid from the pool. If approved claims exceed the pool, payouts scale down proportionally — the pool can never pay more than it holds.
- **Lifecycle is a parameter, not a law** — a mutual may be finite (a defined window, then settlement) or ongoing (members liquidate or withdraw when they choose).

No insurer, no reserve, no retained profit. The pool holds only what members put in, and the money is theirs.

The name is the architecture: riprap is the armor on a breakwater's face — thousands of loose stones, no mortar. One stone is nothing; together they break any wave. Protection without a protector (`meta/naming.md`).

### Core mechanism (the v1 event-mutual lifecycle — the pilot's shape)

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
- **Guaranteed death (v1 shape).** Dissolution is permissionless after the claims window: a crank pays out `user_stake / total_stake × treasury` per member. No permanent treasury, no retained profit, nothing left to capture. Ongoing mutuals end differently — member-driven liquidation or withdrawal under the same custody guarantee, no scheduled death.

### First instance — Micro Mutual: Knife Assault
The reference deployment: **Riprap: Blade Pool @ Breakpoint 2026** — a pool scoped to knife assault during the conference window (15–17 November 2026), in Olympia Convention Centre and its designated event area, London ([solana.com/breakpoint](https://solana.com/breakpoint)). Coverage opens with the conference and closes with the conference, per policy §2 (`meta/Breakpoint/Micro Mutual — Knife Assault - Policy.md`).

| Tier | Entry fee | Max payout |
| --- | --------: | ---------: |
| Basic | $10 | $1,000 |
| Standard | $20 | $2,000 |
| Premium | $40 | $4,000 |

Worked example: 1,000 Standard members → $20,000 pool → 4 approved claims at $2,000 ($8,000 paid) → $12,000 returned pro-rata ($12 per member) → dissolved. A member's worst case is $20; the pool's worst case is empty.

### The claim — two layers: the protocol vs the Breakpoint pilot (rewritten 2026-09-15)

Launch copy runs on one portable claim in two layers that never blend. Layer 1 is the protocol — mutuals anyone can create, on any terms. Layer 2 is the pilot, where the protocol's first shape is bound to published numbers. Pilot specifics never migrate up; the protocol claim never depends on the pilot's shape. General framing derives from the platform thesis (`~/Accord/accord/meta/hanse/PITCH-MUTUAL.md` §1–§3 — mutuals as an open protocol: permissionless creation, one risk per pool, members adjudicate).

**Layer 1 — the protocol** (any mutual, any terms; member-voiced; plain words only — never "mutual", "insurance", or "protocol", never a number, an event, a peril, an expiry, or a refund promise — those are shape parameters, not the protocol):

> "Your group's got you covered."

Hero thesis (landing H1): "Finance went P2P. Risk Cover can too." Runner-up, differentiator-forward: "Peer-to-peer cover." Plain gloss where the audience needs it: "Group cover, no middleman." Ecosystem variant (bio/deck): "Peer-to-peer cover on Solana." Set by the tagline pass, 2026-09-15; "no company" retired — a company may one day take a rate (open question 7), the middleman can't come back.

**Layer 2 — the event-specific pilot** (`Riprap: Blade Pool @ Breakpoint 2026`; instance surfaces and ads only — the platform hero stays numberless):

> "$20 in. Up to $2,000 if the worst happens. Every cent back if nothing does. Then the pool dissolves."

Every figure is the pilot's Standard tier (tier table above); the worked example above is its proof beat. What Layer 2 fixes, the protocol leaves open — the narrowing, in full:

| Protocol (Layer 1 — open parameter) | Pilot specific (Layer 2 — Breakpoint) |
| --- | --- |
| any entry amount | $10 / $20 / $40 tiers (policy §5) |
| any policy content the group defines | knife assault, defined in the policy |
| any scope, any lifetime | one event: Breakpoint 2026, 15–17 November, Olympia + designated area |
| anyone may join | conference attendance required |
| finite or ongoing — the members' choice | expires with the event; claims window, then permanent dissolution |
| recurring contributions to stay a member (roadmap) | one fixed entry fee |
| member-driven liquidation or withdrawal | pro-rata refund of unused funds at dissolution |

### What this is NOT

- Not an insurance company — no reserves, no underwriting beyond tier caps, no profit, no surviving entity.
- Not Accord — adjudication is the sister protocol's job; Riprap owns pooling and the claim lifecycle.
- Not a permanent treasury or DAO — the money is the members'; v1 pools die on schedule, ongoing pools wind down by member choice.

- Not an event platform — events are the pilot's scope; the protocol imposes no template (any risk, any entry, any lifetime).

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
| 8 | Platform scope | **resolved (2026-09-15)** — mutuals as a protocol: permissionless creation, any terms, any lifetime. Supersedes the "event-scoped" platform framing in row 5; event mutuals remain the v1 build and pilot shape, not the protocol's limit |