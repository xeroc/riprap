use anchor_lang::prelude::*;

use crate::error::PoolError;
use crate::events;
use crate::state::*;

/// Exit from the residual split for a paid claimant: the track's authority
/// burns stake after spending the payout (EVENT-MUTUAL §2.4). Moves no
/// tokens — pure accounting (CONTEXT.md, Spending; spec §2.4).
#[derive(Accounts)]
#[instruction(track: Track)]
pub struct Burn<'info> {
    #[account(
        mut,
        constraint = pool.state == PoolState::Open @ PoolError::PoolNotOpen
    )]
    pub pool: Account<'info, Pool>,

    /// The burning track's authority; key or program PDA (CONTEXT.md,
    /// Authority). Same per-track gate as update_authority.
    #[account(constraint = authority.key() == pool.authority(track))]
    pub authority: Signer<'info>,

    /// One depositor position of THIS pool; seeds bind pool and owner.
    #[account(
        mut,
        seeds = [b"depositor", pool.key().as_ref(), owner.key().as_ref()],
        bump,
        constraint = depositor.owner == owner.key(),
        constraint = !depositor.settled @ PoolError::Settled
    )]
    pub depositor: Account<'info, Depositor>,

    /// The depositor's owner — the paid claimant. Not a signer: burn is
    /// push accounting by the authority, not a depositor action.
    /// CHECK: bound by the depositor PDA seeds and owner equality above.
    pub owner: UncheckedAccount<'info>,
}

impl<'info> Burn<'info> {
    /// Remove a paid claimant from the money-weighted residual split
    /// (EVENT-MUTUAL §2.4/§8). No tokens move. The burn is SCOPED to the
    /// burning track: only money that entered through it may leave the
    /// split (audit M-1 2026-10-24, spec amendment 2026-10-26).
    pub fn handler_burn(ctx: Context<Burn>, track: Track, amount: u64) -> Result<()> {
        let (effective, stake_burned) =
            apply(&mut ctx.accounts.pool, &mut ctx.accounts.depositor, track, amount)?;
        emit!(events::Burned {
            pool: ctx.accounts.pool.key(),
            depositor: ctx.accounts.depositor.owner,
            track,
            amount: effective,
            stake_burned,
        });
        Ok(())
    }

}

/// Pure burn accounting — the deposit mirror for payouts (EVENT-MUTUAL §2.4:
/// the authority composes spend + burn in one transaction; spend already
/// moved the money, burn only removes the paid claimant from the
/// money-weighted residual split of §8). Moves NO tokens. Scoped to the
/// burning track (audit M-1 2026-10-24, spec amendment 2026-10-26 —
/// supersedes the saturate-at-every-balance semantics of grill
/// 2026-09-01 Q1): the money side may only drop by what entered through
/// THAT track, so no track's authority can destroy residual weight funded
/// on another track. Returns (effective money, stake actually burned);
/// checked math everywhere, handoff §3.
pub(crate) fn apply(
    pool: &mut Pool,
    depositor: &mut Depositor,
    track: Track,
    amount: u64,
) -> Result<(u64, u128)> {
    require!(pool.state == PoolState::Open, PoolError::PoolNotOpen);
    let rate = pool.rate(track);
    // A closed track never minted stake: no money entered through it, so
    // there is nothing its authority may burn. (Pre-amendment, a closed
    // track's authority retained full claim-destruction power — audit M-1.)
    require!(rate > 0, PoolError::BurnTrackClosed);

    // Track-scoped money: rates are IMMUTABLE after init (no instruction
    // writes them), so stake_T == rate × money_T holds exactly and
    // money_T = stake_T / rate with zero rounding. Load-bearing: a future
    // rate-mutation instruction breaks this derivation.
    let stake_now = match track {
        Track::Ownership => depositor.ownership_stake,
        Track::Rights => depositor.rights_stake,
        Track::Yield => depositor.yield_stake,
    };
    let track_money = stake_now / u128::from(rate);

    // Money side: clamp at the TRACK's own money, never the cross-track
    // depositor total. effective <= amount <= u64::MAX, so the cast is
    // exact. The depositor total and the pool total drop by the SAME
    // amount, or pool.total stops equaling the sum of depositor totals and
    // the crank denominator corrupts every remaining member's residual
    // share (§8).
    let effective = u128::from(amount).min(track_money) as u64;
    depositor.total_amount = depositor
        .total_amount
        .checked_sub(effective)
        .ok_or(PoolError::MathOverflow)?; // defensive: effective <= track slice of the total
    pool.total_amount = pool
        .total_amount
        .checked_sub(u128::from(effective))
        .ok_or(PoolError::MathOverflow)?; // defensive: same invariant

    // Stake side: effective × rate <= stake_now by construction — exact,
    // no saturation (retired with the cross-track scope).
    let stake_burn = u128::from(effective)
        .checked_mul(u128::from(rate))
        .ok_or(PoolError::MathOverflow)?;
    match track {
        Track::Ownership => {
            depositor.ownership_stake = depositor
                .ownership_stake
                .checked_sub(stake_burn)
                .ok_or(PoolError::MathOverflow)?;
        }
        Track::Rights => {
            depositor.rights_stake = depositor
                .rights_stake
                .checked_sub(stake_burn)
                .ok_or(PoolError::MathOverflow)?;
        }
        Track::Yield => {
            depositor.yield_stake = depositor
                .yield_stake
                .checked_sub(stake_burn)
                .ok_or(PoolError::MathOverflow)?;
        }
    }
    Ok((effective, stake_burn))
}

#[cfg(test)]
mod tests {
    use super::*;

    use anchor_lang::error::ERROR_CODE_OFFSET;
    use crate::instructions::deposit;

    fn code(err: anchor_lang::error::Error) -> u32 {
        match err {
            anchor_lang::error::Error::AnchorError(ae) => ae.error_code_number,
            _ => panic!("expected AnchorError"),
        }
    }

    fn pool() -> Pool {
        Pool {
            mint: Pubkey::default(),
            state: PoolState::Open,
            ownership_rate: 0,
            rights_rate: 1,
            yield_rate: 2,
            ownership_authority: Pubkey::new_unique(),
            rights_authority: Pubkey::new_unique(),
            yield_authority: Pubkey::new_unique(),
            total_amount: 0,
            seed: 0,
            bump: 255,
            liquidation_balance: 0,
            padding: [0; 64],
        }
    }

    fn depositor() -> Depositor {
        Depositor {
            owner: Pubkey::new_unique(),
            residual_beneficiary: Pubkey::default(),
            total_amount: 0,
            ownership_stake: 0,
            rights_stake: 0,
            yield_stake: 0,
            settled: false,
            padding: [0; 64],
        }
    }

    /// EVENT-MUTUAL §2.4/§8: burning min(payout, contribution) at rate 1
    /// zeroes the depositor total — the paid claimant exits the residual
    /// split, and the remaining member's share is measured against the
    /// reduced pool total alone.
    #[test]
    fn burn_rate_1_exits_the_residual_split() {
        let mut p = pool();
        let mut paid = depositor();
        let mut remaining = depositor();
        deposit::apply(&mut p, &mut paid, Track::Rights, 20_000_000).unwrap();
        deposit::apply(&mut p, &mut remaining, Track::Rights, 20_000_000).unwrap();

        let (money, stake) = apply(&mut p, &mut paid, Track::Rights, 20_000_000).unwrap();

        assert_eq!(money, 20_000_000);
        assert_eq!(stake, 20_000_000);
        assert_eq!(paid.total_amount, 0);
        assert_eq!(paid.rights_stake, 0);
        assert_eq!(p.total_amount, 20_000_000);
        // the unburned member is untouched
        assert_eq!(remaining.total_amount, 20_000_000);
        assert_eq!(remaining.rights_stake, 20_000_000);
    }

    /// Grill 2026-09-01 Q1: at rate 2 the track stake drops amount x rate
    /// while both totals drop amount.
    #[test]
    fn burn_rate_2_drops_stake_by_amount_times_rate() {
        let mut p = pool();
        let mut d = depositor();
        deposit::apply(&mut p, &mut d, Track::Yield, 100).unwrap(); // stake 200

        let (money, stake) = apply(&mut p, &mut d, Track::Yield, 40).unwrap();

        assert_eq!(money, 40);
        assert_eq!(stake, 80);
        assert_eq!(d.yield_stake, 120);
        assert_eq!(d.total_amount, 60);
        assert_eq!(p.total_amount, 60);
    }

    /// Over-burn clamps at the TRACK's money (spec amendment 2026-10-26):
    /// a single-track depositor's track money == its total, so the clamp
    /// zeroes both — same outcome as the retired saturation, now exact.
    #[test]
    fn amount_over_track_money_clamps() {
        let mut p = pool();
        let mut d = depositor();
        deposit::apply(&mut p, &mut d, Track::Rights, 100).unwrap();

        let (money, stake) = apply(&mut p, &mut d, Track::Rights, 250).unwrap();

        assert_eq!(money, 100);
        assert_eq!(stake, 100);
        assert_eq!(d.total_amount, 0);
        assert_eq!(d.rights_stake, 0);
        assert_eq!(p.total_amount, 0);
    }

    /// Audit M-1 2026-10-24, the core: a yield-authority burn may only
    /// remove money that entered through YIELD. The requested 100 clamps
    /// at the yield track's 50 (stake 100 / rate 2); the rights-funded
    /// residual survives untouched.
    #[test]
    fn burn_scopes_to_the_burning_track() {
        let mut p = pool();
        let mut d = depositor();
        deposit::apply(&mut p, &mut d, Track::Rights, 100).unwrap(); // stake 100
        deposit::apply(&mut p, &mut d, Track::Yield, 50).unwrap(); // stake 100

        // requested 100 > yield track money 50
        let (money, stake) = apply(&mut p, &mut d, Track::Yield, 100).unwrap();

        assert_eq!(money, 50);
        assert_eq!(stake, 100);
        assert_eq!(d.yield_stake, 0);
        assert_eq!(d.rights_stake, 100);
        assert_eq!(d.total_amount, 100);
        assert_eq!(p.total_amount, 100);
    }

    /// Audit M-1 2026-10-24: burning on a live track the depositor never
    /// funded is an exact no-op — zero money, zero stake, totals intact.
    /// No track's authority can destroy residual weight funded elsewhere.
    #[test]
    fn burn_on_unfunded_track_is_a_noop() {
        let mut p = pool();
        let mut d = depositor();
        deposit::apply(&mut p, &mut d, Track::Rights, 100).unwrap();

        let (money, stake) = apply(&mut p, &mut d, Track::Yield, 100).unwrap();

        assert_eq!((money, stake), (0, 0));
        assert_eq!(d.total_amount, 100);
        assert_eq!(d.rights_stake, 100);
        assert_eq!(d.yield_stake, 0);
        assert_eq!(p.total_amount, 100);
    }

    /// Audit M-1: a CLOSED track (rate 0) never minted stake — its
    /// authority has nothing to burn and the call reverts.
    #[test]
    fn closed_track_burn_reverts() {
        let mut p = pool();
        let mut d = depositor();
        deposit::apply(&mut p, &mut d, Track::Rights, 100).unwrap();

        let err = apply(&mut p, &mut d, Track::Ownership, 1).unwrap_err();
        assert_eq!(
            code(err),
            PoolError::BurnTrackClosed as u32 + ERROR_CODE_OFFSET
        );
    }

    /// Liquidation freezes burn (spec §5: liquidate "freezes deposit/spend/
    /// burn") — same PoolNotOpen guard as deposit.
    #[test]
    fn liquidated_pool_reverts() {
        let mut p = pool();
        p.state = PoolState::Liquidated;
        let mut d = depositor();
        let err = apply(&mut p, &mut d, Track::Rights, 1).unwrap_err();
        assert_eq!(code(err), PoolError::PoolNotOpen as u32 + ERROR_CODE_OFFSET);
    }

    /// Overflow guard (handoff §3): u64 amount x u64 rate is computed in a
    /// u128 intermediate and can never overflow — extremes burn cleanly.
    /// track_money = u128::MAX / u64::MAX = 2^64 + 1 > amount, so the full
    /// amount burns and the clamp never truncates.
    #[test]
    fn extremes_do_not_overflow() {
        let mut p = pool();
        p.yield_rate = u64::MAX;
        p.total_amount = u128::MAX;
        let mut d = depositor();
        d.total_amount = u64::MAX;
        d.yield_stake = u128::MAX;

        let max_sq = u128::from(u64::MAX) * u128::from(u64::MAX);
        let (money, stake) = apply(&mut p, &mut d, Track::Yield, u64::MAX).unwrap();

        assert_eq!(money, u64::MAX);
        assert_eq!(stake, max_sq);
        assert_eq!(d.yield_stake, u128::MAX - max_sq);
        assert_eq!(d.total_amount, 0);
        assert_eq!(p.total_amount, u128::MAX - u128::from(u64::MAX));
    }
}
