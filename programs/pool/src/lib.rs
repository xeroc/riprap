//! Pool program — the pool layer of Riprap.
//!
//! Domain language: `CONTEXT.md`. A pool is deposited money with exactly two
//! governed exits — spending and liquidation — and no third path exists.
//!
//! Layout follows the anchor convention: accounts structs live in
//! `instructions/*`, pure logic in the owning module, instruction bodies here.

pub mod error;
pub mod events;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;
use anchor_spl::token;

pub use instructions::*;
pub use state::*;

declare_id!("63EvHuWaMRSZhD9EPXd7UeW5YFFv41GQUHpv7LpY6wm1");

#[program]
pub mod pool {
    use super::*;

    /// Create a pool PDA at ["pool", seed] with its own treasury ATA (ADR-0001).
    /// Rates are stake minted per unit deposited; zero closes that track.
    pub fn init(ctx: Context<InitPool>, params: InitParams) -> Result<()> {
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
        // seed lives in the PDA; it is not restated in state (handoff §2).
        Ok(())
    }

    /// Deposit into one track; mints stake at that track's rate and moves the
    /// money into the treasury. The only way money enters.
    pub fn deposit(ctx: Context<Deposit>, track: Track, amount: u64) -> Result<()> {
        // Stake math and bookkeeping before the transfer — no state changes if it reverts.
        let stake =
            instructions::deposit::apply(&mut ctx.accounts.pool, &mut ctx.accounts.depositor, track, amount)?;
        let owner = ctx.accounts.owner.key();
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.key(),
                token::Transfer {
                    from: ctx.accounts.owner_ata.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                    authority: ctx.accounts.owner.to_account_info(),
                },
            ),
            amount,
        )?;
        // init_if_needed: owner is only set meaningfully on first creation.
        ctx.accounts.depositor.owner = owner;
        emit!(events::Deposit {
            pool: ctx.accounts.pool.key(),
            depositor: owner,
            track,
            amount,
            stake,
        });
        Ok(())
    }
}
