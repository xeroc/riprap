use anchor_lang::prelude::*;

use crate::state::*;

/// Swap one track's authority. The CURRENT authority of that track signs;
/// the pool does not care whether authorities are keys or program PDAs
/// (CONTEXT.md, Authority).
#[derive(Accounts)]
#[instruction(track: Track)]
pub struct UpdateAuthority<'info> {
    #[account(mut)]
    pub pool: Account<'info, Pool>,

    #[account(constraint = authority.key() == pool.authority(track))]
    pub authority: Signer<'info>,
}
