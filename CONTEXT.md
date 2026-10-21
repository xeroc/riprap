# Riprap

Purpose pools on Solana — member money bound to one purpose, fixed at creation (repositioned 2026-10-20; was "event-scoped mutual protection pools"). This glossary is the domain language; the pool program (`programs/pool`) implements the pool layer. Implementation details live in code and ADRs, never here.

## Pool layer (this program)

**Pool**:
A collection of deposited money with exactly two governed exits — spending and liquidation. No third path exists.
_Avoid_: fund, mutual (a mutual is one use of a pool), treasury

**Treasury**:
The pool's single token account. All deposits land in it; both doors pay out of it.
_Avoid_: vault, escrow

**Track**:
One of three claim dimensions of a pool — ownership, rights, yield — each with its own stake rate and authority.
_Avoid_: tranche, class

**Stake**:
A depositor's holding in one track, minted on deposit at that track's stake rate.
_Avoid_: share, token, amount_per_stake. Not the same thing as an Accord juror stake.

**Stake rate**:
Stake minted per unit deposited, held per track as `ownership_rate`, `rights_rate`, `yield_rate`. Zero means the track is closed — deposits into it are rejected.
_Avoid_: amount per stake (that name inverts the meaning; a zero under that reading would mint infinite stake)

**Depositor**:
A party that has deposited into a pool; tracked with its total deposited amount and per-track stakes. One depositor position per pool per party.
_Avoid_: member (mutual layer), user, holder

**Authority**:
The controller of one track's powers: the rights authority governs spending, the ownership authority governs liquidation, the yield authority is reserved. An authority is whatever key or program PDA the pool was configured with — the pool does not care which.
_Avoid_: owner, admin, signer

**Spending**:
Exit door one — the rights authority moves treasury money out to a destination. In the full design this is how adjudicated claims get paid.
_Avoid_: payout (claims-layer word), transfer, withdraw

**Liquidation**:
Exit door two — the ownership authority permanently ends the pool. After it, deposits are refused and only the liquidation crank can move money.
_Avoid_: dissolution (mutual-layer ceremony on top), close

**Liquidation crank**:
The permissionless instruction that pays each depositor its money-weighted share of the remaining treasury. Repeatable per depositor exactly once.
_Avoid_: refund, withdraw, claim

**Money-weighted share**:
A depositor's liquidation fraction: its total deposits divided by all deposits. Rates and stakes never distort it — unused money comes back per unit contributed.
_Avoid_: stake-weighted share, pro-rata stake

**Settled**:
A depositor that has received its liquidation payout. A settled depositor cannot deposit again or receive another payout.

## Mutual layer (not this program)

**Member, Claim, Tier, Juror**:
Policy-layer concepts owned by the mutual program and `meta/Breakpoint/Micro Mutual — Knife Assault - Policy.md`. The pool knows none of them; entry fees, tier caps ($10/$20/$40 entry, $1,000/$2,000/$4,000 caps), claims windows, and juror staking live above the pool.

## Circle layer (the kitty program, planned)

**Circle**:
An ongoing purpose pool — members contribute per epoch, request payouts of any amount, and the members adjudicate requests against the circle's purpose.
_Avoid_: funding circle (descriptive, never canonical), subscription pool, ROSCA, ongoing mutual

**Epoch**:
The circle's fixed-length settlement period; budget, renewal, and exits all turn at its boundary.
_Avoid_: period, cycle, round (an Accord round is a juror vote)

**Contribution**:
A member's per-epoch payment; it stacks capital and renews rights together.
_Avoid_: premium (banned word), entry fee (mutual layer), subscription payment

**Renewal**:
Paying for the next epoch's cover; extends forward from payment or current expiry, whichever is later — never retroactive over a gap.
_Avoid_: autopay, top-up

**Request**:
A member's ask for money from the circle — any amount, adjudicated with the purpose as the measure.
_Avoid_: claim (mutual layer), ask, application

**Budget**:
The most a circle may pay out in one epoch; consumed at filing, refreshed at the boundary.
_Avoid_: cap, max payout (tier words)

**Reserve**:
The amount a filed request holds from its epoch's budget until ruled; released whole on denial.
_Avoid_: escrow, lock

**Obligation**:
An approved request not yet paid, queued until budget allows; obligations bind no more than the treasury holds.
_Avoid_: debt, outstanding claim

**Recovery ratio**:
Treasury over total contributions — the one number: requests lower it, contributions raise it, exits never move it.
_Avoid_: NAV, unit price, implied premium (premium is banned outright)

**Exit intent**:
A member's declaration it will leave; settles at the first boundary its paid cover ends, against the exit base — never delayed, never credential-gated.
_Avoid_: withdrawal, refund, redeem

**Exit base**:
Treasury minus reserves minus obligations — the only pot exit intents divide.
_Avoid_: residual, remainder

**Entry credential**:
The external membership attestation gating join, renewal, and filing; it never gates money out.
_Avoid_: ticket, pass, KYC

**Take**:
The operator's off-the-top share of an adjudicated payout; set at creation, reducible, never increasable.
_Avoid_: fee, premium, cut

**Protocol share**:
The platform's fraction of the operator's take.
_Avoid_: protocol fee, royalty
