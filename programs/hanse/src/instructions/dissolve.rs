use anchor_lang::prelude::*;
use anchor_spl::token::{Token, TokenAccount};

use crate::error::HanseError;
use crate::events::MutualDissolved;
use crate::state::{Mutual, Phase};

/// Account context for `dissolve` — permissionless crank (EVENT-MUTUAL §7).
/// Terminal: whatever remains in the treasury after the pull window is the
/// residual; members exit via the pool crank directly — NO mutual wrapper.
#[derive(Accounts)]
pub struct Dissolve<'info> {
    /// Anyone — pays tx fees, gains nothing.
    pub cranker: Signer<'info>,

    #[account(
        mut,
        constraint = mutual.phase == Phase::Settled @ HanseError::NotSettled,
    )]
    pub mutual: Box<Account<'info, Mutual>>,

    /// The mutual's ownership authority over its pool — PDA ["mutual_own",
    /// mutual] under this program; signs the liquidation CPI.
    /// CHECK: seeds-verified here; the pool re-checks it equals its recorded
    /// ownership authority inside the CPI.
    #[account(seeds = [b"mutual_own", mutual.key().as_ref()], bump)]
    pub ownership_authority: UncheckedAccount<'info>,

    /// CHECK: must be exactly `mutual.pool`; the pool program re-checks its
    /// own accounts inside the CPI.
    #[account(mut, constraint = pool.key() == mutual.pool @ HanseError::WrongPool)]
    pub pool: UncheckedAccount<'info>,

    /// The pool treasury — snapshotted by the liquidation as the crank base.
    /// CHECK: canonical pool ATA, verified in the handler.
    #[account(mut)]
    pub treasury: Box<Account<'info, TokenAccount>>,

    pub token_program: Program<'info, Token>,
    /// CHECK: address-constrained to the pool program id.
    #[account(address = pool::ID)]
    pub pool_program: UncheckedAccount<'info>,
}

impl<'info> Dissolve<'info> {
    pub fn handler_dissolve(ctx: Context<Dissolve<'info>>) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let mutual = &ctx.accounts.mutual;

        // The pull window must be OVER: unpaid amounts have reverted to the
        // residual (§2.5).
        require!(now >= mutual.pull_close_at, HanseError::PullWindowOpen);

        let expected_treasury = anchor_spl::associated_token::get_associated_token_address(
            &mutual.pool,
            &mutual.deposit_mint,
        );
        require_keys_eq!(
            ctx.accounts.treasury.key(),
            expected_treasury,
            HanseError::WrongTreasury
        );

        // Door two, from the mutual's ownership authority PDA.
        let mutual_key = mutual.key();
        let signer_seeds: &[&[&[u8]]] = &[&[
            b"mutual_own",
            mutual_key.as_ref(),
            &[ctx.bumps.ownership_authority],
        ]];
        pool::cpi::liquidate(CpiContext::new_with_signer(
            ctx.accounts.pool_program.key(),
            pool::cpi::accounts::Liquidate {
                pool: ctx.accounts.pool.to_account_info(),
                ownership_authority: ctx.accounts.ownership_authority.to_account_info(),
                treasury: ctx.accounts.treasury.to_account_info(),
                token_program: ctx.accounts.token_program.to_account_info(),
            },
            signer_seeds,
        ))?;

        ctx.accounts.mutual.phase = Phase::Dissolved;

        emit!(MutualDissolved { mutual: mutual_key });
        Ok(())
    }
}
