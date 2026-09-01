use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};
use crate::error::PoolError;
use crate::events;
use crate::state::*;

/// Exit door two: the ownership authority permanently ends the pool.
/// After it, deposits are refused and only the crank can move money
/// (CONTEXT.md, Liquidation). Terminal.
#[derive(Accounts)]
pub struct Liquidate<'info> {
    #[account(
        mut,
        constraint = pool.state == PoolState::Open @ PoolError::PoolNotOpen
    )]
    pub pool: Account<'info, Pool>,

    #[account(constraint = ownership_authority.key() == pool.ownership_authority)]
    pub ownership_authority: Signer<'info>,

    /// Read-only: snapshot the remaining treasury as the crank base.
    #[account(
        associated_token::mint = pool.mint,
        associated_token::authority = pool,
    )]
    pub treasury: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}

impl<'info> Liquidate<'info> {
    /// Exit door two: the ownership authority permanently ends the pool.
    /// After this only the crank can move money. Terminal.
    pub fn handler_liquidate(ctx: Context<Liquidate>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        require!(pool.state == PoolState::Open, PoolError::PoolNotOpen);
        // Freeze the remaining treasury as the base every crank pays against:
        // payout order must never dilute a depositor's share.
        pool.liquidation_balance = ctx.accounts.treasury.amount;
        pool.state = PoolState::Liquidated;
        emit!(events::Liquidated { pool: pool.key() });
        Ok(())
    }
}
