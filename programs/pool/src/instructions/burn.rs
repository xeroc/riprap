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
    /// (EVENT-MUTUAL §2.4/§8). No tokens move.
    pub fn handler_burn(ctx: Context<Burn>, track: Track, amount: u64) -> Result<()> {
        let stake_burned =
            apply(&mut ctx.accounts.pool, &mut ctx.accounts.depositor, track, amount)?;
        emit!(events::Burned {
            pool: ctx.accounts.pool.key(),
            depositor: ctx.accounts.depositor.owner,
            track,
            amount,
            stake_burned,
        });
        Ok(())
    }

}

/// Pure burn accounting — the deposit mirror for payouts (EVENT-MUTUAL §2.4:
/// the authority composes spend + burn in one transaction; spend already
/// moved the money, burn only removes the paid claimant from the
/// money-weighted residual split of §8). Moves NO tokens. Saturates at every
/// balance instead of reverting (grill 2026-09-01 Q1). Returns the stake
/// actually burned (checked math everywhere, handoff §3).
pub(crate) fn apply(
    pool: &mut Pool,
    depositor: &mut Depositor,
    track: Track,
    amount: u64,
) -> Result<u128> {
    require!(pool.state == PoolState::Open, PoolError::PoolNotOpen);
    let rate = pool.rate(track);

    // Money side: saturate at the depositor's balance. The depositor total
    // and the pool total must drop by the SAME amount, or pool.total stops
    // equaling the sum of depositor totals and the crank denominator
    // corrupts every remaining member's residual share (§8).
    let effective = amount.min(depositor.total_amount);
    depositor.total_amount -= effective;
    pool.total_amount = pool.total_amount.saturating_sub(u128::from(effective));

    // Stake side: amount x rate in a u128 intermediate (handoff §3),
    // saturating at the track stake balance (spec §2.4).
    let stake_burn = u128::from(amount)
        .checked_mul(u128::from(rate))
        .ok_or(PoolError::MathOverflow)?;
    let burned = match track {
        Track::Ownership => {
            let before = depositor.ownership_stake;
            depositor.ownership_stake = before.saturating_sub(stake_burn);
            before - depositor.ownership_stake
        }
        Track::Rights => {
            let before = depositor.rights_stake;
            depositor.rights_stake = before.saturating_sub(stake_burn);
            before - depositor.rights_stake
        }
        Track::Yield => {
            let before = depositor.yield_stake;
            depositor.yield_stake = before.saturating_sub(stake_burn);
            before - depositor.yield_stake
        }
    };
    Ok(burned)
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
        }
    }

    fn depositor() -> Depositor {
        Depositor {
            owner: Pubkey::new_unique(),
            total_amount: 0,
            ownership_stake: 0,
            rights_stake: 0,
            yield_stake: 0,
            settled: false,
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

        let burned = apply(&mut p, &mut paid, Track::Rights, 20_000_000).unwrap();

        assert_eq!(burned, 20_000_000);
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

        let burned = apply(&mut p, &mut d, Track::Yield, 40).unwrap();

        assert_eq!(burned, 80);
        assert_eq!(d.yield_stake, 120);
        assert_eq!(d.total_amount, 60);
        assert_eq!(p.total_amount, 60);
    }

    /// Saturation: amount over the depositor total zeroes it instead of
    /// reverting (grill Q1; spec §2.4 "burn saturates").
    #[test]
    fn amount_over_total_amount_saturates() {
        let mut p = pool();
        let mut d = depositor();
        deposit::apply(&mut p, &mut d, Track::Rights, 100).unwrap();

        let burned = apply(&mut p, &mut d, Track::Rights, 250).unwrap();

        assert_eq!(burned, 100);
        assert_eq!(d.total_amount, 0);
        assert_eq!(d.rights_stake, 0);
        assert_eq!(p.total_amount, 0);
    }

    /// Saturation: amount x rate over the track stake zeroes that stake
    /// without touching the other tracks' stakes.
    #[test]
    fn stake_burn_over_track_stake_saturates() {
        let mut p = pool();
        let mut d = depositor();
        deposit::apply(&mut p, &mut d, Track::Rights, 100).unwrap(); // stake 100
        deposit::apply(&mut p, &mut d, Track::Yield, 50).unwrap(); // stake 100

        // 100 x rate 2 = 200 > yield stake 100
        let burned = apply(&mut p, &mut d, Track::Yield, 100).unwrap();

        assert_eq!(burned, 100);
        assert_eq!(d.yield_stake, 0);
        assert_eq!(d.rights_stake, 100);
        assert_eq!(d.total_amount, 50);
        assert_eq!(p.total_amount, 50);
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
    #[test]
    fn extremes_do_not_overflow() {
        let mut p = pool();
        p.yield_rate = u64::MAX;
        p.total_amount = u128::MAX;
        let mut d = depositor();
        d.total_amount = u64::MAX;
        d.yield_stake = u128::MAX;

        let max_sq = u128::from(u64::MAX) * u128::from(u64::MAX);
        let burned = apply(&mut p, &mut d, Track::Yield, u64::MAX).unwrap();

        assert_eq!(burned, max_sq);
        assert_eq!(d.yield_stake, u128::MAX - max_sq);
        assert_eq!(d.total_amount, 0);
        assert_eq!(p.total_amount, u128::MAX - u128::from(u64::MAX));
    }
}
