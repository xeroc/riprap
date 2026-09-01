use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

use crate::error::PoolError;
use crate::state::*;

/// Exit door one: the rights authority pushes treasury money out to a
/// destination (CONTEXT.md, Spending). In the full design this is how
/// adjudicated claims get paid. Payouts are push, not pull (ADR-0001).
#[derive(Accounts)]
pub struct Spend<'info> {
    /// Spend does not mutate pool state; the treasury balance is the record.
    #[account(constraint = pool.state == PoolState::Open @ PoolError::PoolNotOpen)]
    pub pool: Account<'info, Pool>,

    /// Whoever the pool was configured with; key or program PDA (CONTEXT.md, Authority).
    #[account(constraint = rights_authority.key() == pool.rights_authority)]
    pub rights_authority: Signer<'info>,

    /// Treasury: must be THIS pool's canonical ATA (mint + authority = pool),
    /// so money can never land in or leave another pool's treasury.
    #[account(
        mut,
        associated_token::mint = pool.mint,
        associated_token::authority = pool,
    )]
    pub treasury: Account<'info, TokenAccount>,

    /// Any token account of the pool's token receiving the money.
    #[account(constraint = destination.mint == pool.mint)]
    pub destination: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
}
