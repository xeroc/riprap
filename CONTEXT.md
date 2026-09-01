# Riprap

Event-scoped mutual protection pools on Solana. This glossary is the domain language; the pool program (`programs/pool`) implements the pool layer. Implementation details live in code and ADRs, never here.

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
