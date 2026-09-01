use anchor_lang::prelude::*;

use crate::events;
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

impl<'info> UpdateAuthority<'info> {
    /// Hand one track's powers to a new controller. The current authority of
    /// that track must sign; any pubkey or program PDA is acceptable.
    pub fn handler_update_authority(
        ctx: Context<UpdateAuthority>,
        track: Track,
        new: Pubkey,
    ) -> Result<()> {
        ctx.accounts.pool.set_authority(track, new);
        emit!(events::AuthorityUpdated {
            pool: ctx.accounts.pool.key(),
            track,
            new_authority: new,
        });
        Ok(())
    }
}
