use anchor_lang::prelude::*;
use anchor_spl::{
    associated_token::AssociatedToken, token::Mint, token::Token, token::TokenAccount,
};

use crate::state::*;

/// Everything a pool is configured with at birth (handoff §2: seed, rates x3,
/// authorities x3). Zero rates close their track from the start.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, Debug)]
pub struct InitParams {
    pub seed: u64,
    pub ownership_rate: u64,
    pub rights_rate: u64,
    pub yield_rate: u64,
    pub ownership_authority: Pubkey,
    pub rights_authority: Pubkey,
    pub yield_authority: Pubkey,
}

#[derive(Accounts)]
#[instruction(params: InitParams)]
pub struct InitPool<'info> {
    /// Pays for the pool account and the treasury ATA.
    #[account(mut)]
    pub payer: Signer<'info>,

    /// The one token this pool accepts. No hardcoded mints (handoff §3).
    pub mint: Account<'info, Mint>,

    /// Pool PDA, seeds = ["pool", seed le u64] (handoff §2).
    #[account(
        init,
        payer = payer,
        space = POOL_SPACE,
        seeds = [b"pool", params.seed.to_le_bytes().as_ref()],
        bump
    )]
    pub pool: Account<'info, Pool>,

    /// Treasury: the pool PDA's own ATA, both doors pay out of it (ADR-0001).
    #[account(
        init,
        payer = payer,
        associated_token::mint = mint,
        associated_token::authority = pool,
    )]
    pub treasury: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
}

impl<'info> InitPool<'info> {
    pub fn handler_init(ctx: Context<InitPool>, params: InitParams) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        pool.mint = ctx.accounts.mint.key();
        pool.state = PoolState::Open;
        pool.ownership_rate = params.ownership_rate;
        pool.rights_rate = params.rights_rate;
        pool.yield_rate = params.yield_rate;
        pool.ownership_authority = params.ownership_authority;
        pool.rights_authority = params.rights_authority;
        pool.yield_authority = params.yield_authority;
        pool.total_amount = 0;
        // Restated so the PDA can sign spend/crank transfers (see state.rs).
        pool.seed = params.seed;
        pool.bump = ctx.bumps.pool;
        Ok(())
    }
}
