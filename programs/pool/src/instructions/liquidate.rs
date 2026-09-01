use anchor_lang::prelude::*;

use crate::error::PoolError;
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
}
