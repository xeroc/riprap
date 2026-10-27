use anchor_lang::prelude::*;
use anchor_spl::associated_token::{get_associated_token_address, AssociatedToken};
use anchor_spl::token::{self, Token, TokenAccount};

use crate::error::PoolError;
use crate::events;
use crate::state::*;

/// Permissionless liquidation crank: pays one depositor its money-weighted
/// share of the remaining treasury, exactly once (CONTEXT.md, Liquidation
/// crank). Repeatable per depositor, not per pool.
#[derive(Accounts)]
pub struct Crank<'info> {
    #[account(constraint = pool.state == PoolState::Liquidated @ PoolError::PoolNotLiquidated)]
    pub pool: Account<'info, Pool>,

    /// The crank initiator; permissionless — anyone. Pays tx fees only.
    pub cranker: Signer<'info>,

    /// One depositor position of THIS pool; seeds bind pool and owner.
    #[account(
        mut,
        seeds = [b"depositor", pool.key().as_ref(), owner.key().as_ref()],
        bump,
        constraint = depositor.owner == owner.key(),
        constraint = !depositor.settled @ PoolError::Settled
    )]
    pub depositor: Account<'info, Depositor>,

    /// The depositor's owner — receives the payout. Not a signer: cranking
    /// someone else's position pays that someone, never the cranker.
    /// CHECK: bound by the depositor PDA seeds and owner equality above.
    pub owner: UncheckedAccount<'info>,

    /// Payout destination: the canonical ATA of the position's residual
    /// payee — the owner, or the beneficiary when a funder sponsored the
    /// position. Exactly one address passes: the assignment made at first
    /// deposit is the contract, not a menu for whoever turns the crank.
    #[account(
        mut,
        constraint = {
            let payee = if depositor.residual_beneficiary == Pubkey::default() {
                depositor.owner
            } else {
                depositor.residual_beneficiary
            };
            destination.mint == pool.mint
                && destination.key() == get_associated_token_address(&payee, &pool.mint)
        } @ PoolError::WrongDestination
    )]
    pub destination: Account<'info, TokenAccount>,

    #[account(
        mut,
        associated_token::mint = pool.mint,
        associated_token::authority = pool,
    )]
    pub treasury: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
}

impl<'info> Crank<'info> {
    /// Permissionless: pays one depositor its money-weighted share of the
    /// remaining treasury and marks it settled. Exactly once per depositor.
    pub fn handler_crank(ctx: Context<Crank>) -> Result<()> {
        let depositor = &mut ctx.accounts.depositor;
        let paid = payout(
            ctx.accounts.pool.liquidation_balance,
            depositor.total_amount,
            ctx.accounts.pool.total_amount,
        )?;
        let pool = &ctx.accounts.pool;
        let seed_le = pool.seed.to_le_bytes();
        let bump = [pool.bump];
        let signer_seeds: &[&[&[u8]]] = &[&[b"pool".as_ref(), seed_le.as_ref(), bump.as_ref()]];
        token::transfer(
            CpiContext::new_with_signer(
                ctx.accounts.token_program.key(),
                token::Transfer {
                    from: ctx.accounts.treasury.to_account_info(),
                    to: ctx.accounts.destination.to_account_info(),
                    authority: pool.to_account_info(),
                },
                signer_seeds,
            ),
            paid,
        )?;
        depositor.settled = true;
        emit!(events::CrankPaid {
            pool: pool.key(),
            depositor: depositor.owner,
            beneficiary: depositor.residual_beneficiary,
            paid,
        });
        Ok(())
    }
}

/// Money-weighted share of the remaining treasury: depositor total divided by
/// all deposits, floored. Rates and stakes never distort it (CONTEXT.md).
pub(crate) fn payout(treasury_balance: u64, depositor_total: u64, pool_total: u128) -> Result<u64> {
    // Zero-weight terminal (audit M-2 2026-10-24, spec amendment
    // 2026-10-26): every depositor burned out — e.g. a solvent mutual whose
    // every member's claim paid past its contribution. There is no residual
    // split left to divide by: pay 0 and let the crank settle the depositor,
    // preserving the §8 exactly-once exclusion. Leftover treasury in this
    // state is the same accepted class as rounding dust.
    if pool_total == 0 {
        return Ok(0);
    }
    // Local bound for the cast below: depositor totals sum to pool_total,
    // so one depositor's share can never exceed it — asserted, not assumed.
    require!(
        u128::from(depositor_total) <= pool_total,
        PoolError::MathOverflow
    );
    let pay = (u128::from(treasury_balance) * u128::from(depositor_total))
        .checked_div(pool_total)
        .ok_or(PoolError::MathOverflow)?; // unreachable behind the guard; defensive
    // pay <= treasury_balance by construction, always fits u64.
    Ok(pay as u64)
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Test matrix: deposits 10/20/40 (total 70) after a 2000 spend of 7000
    /// → remaining 5000; payouts = floor(share × remaining), sum <= balance.
    #[test]
    fn matrix_10_20_40_after_spend_2000() {
        let total: u128 = 7000;
        let remaining = 5000u64;
        let p10 = payout(remaining, 1000, total).unwrap();
        let p20 = payout(remaining, 2000, total).unwrap();
        let p40 = payout(remaining, 4000, total).unwrap();
        assert_eq!(p10, 714); // floor(1000/7000 * 5000) = floor(714.28)
        assert_eq!(p20, 1428); // floor(1428.57)
        assert_eq!(p40, 2857); // floor(2857.14)
        assert!(p10 + p20 + p40 <= remaining);
    }

    /// Full refund when nothing was spent: shares sum to the whole balance.
    #[test]
    fn full_balance_when_no_spend() {
        let total: u128 = 70_000_000;
        let bal = 70_000_000u64;
        let p10 = payout(bal, 10_000_000, total).unwrap();
        let p20 = payout(bal, 20_000_000, total).unwrap();
        let p40 = payout(bal, 40_000_000, total).unwrap();
        assert_eq!(p10, 10_000_000);
        assert_eq!(p20, 20_000_000);
        assert_eq!(p40, 40_000_000);
        assert_eq!(p10 + p20 + p40, bal);
    }

    /// Tiny remainders lose dust to the floor, never overpay.
    #[test]
    fn floor_loses_dust_never_overpays() {
        let total: u128 = 3;
        let bal = 2u64;
        assert_eq!(payout(bal, 2, total).unwrap(), 1);
        assert_eq!(payout(bal, 1, total).unwrap(), 0); // dust lost
        assert_eq!(payout(bal, 2, total).unwrap() + payout(bal, 1, total).unwrap(), 1);
    }

    /// Zero-weight terminal (audit M-2 2026-10-24): pool_total == 0 pays 0
    /// instead of reverting, so a fully-burned-out pool's depositors can
    /// still reach their settled terminal.
    #[test]
    fn zero_pool_total_pays_zero_terminal() {
        assert_eq!(payout(1, 1, 0).unwrap(), 0);
        assert_eq!(payout(9_999_999, 123, 0).unwrap(), 0);
    }

    /// The local cast bound: depositor_total > pool_total violates the
    /// depositor-totals-sum invariant and must revert, not truncate.
    #[test]
    fn depositor_over_pool_total_reverts() {
        assert!(payout(100, 101, 100).is_err());
    }
}
