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

pub use error::PoolError;
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
        // Restated so the PDA can sign spend/crank transfers (see state.rs).
        pool.seed = params.seed;
        pool.bump = ctx.bumps.pool;
        Ok(())
    }

    /// Deposit into one track; mints stake at that track's rate and moves the
    /// money into the treasury. The only way money enters.
    pub fn deposit(ctx: Context<Deposit>, track: Track, amount: u64) -> Result<()> {
        // Stake math and bookkeeping before the transfer — no state changes if it reverts.
        let stake = instructions::deposit::apply(
            &mut ctx.accounts.pool,
            &mut ctx.accounts.depositor,
            track,
            amount,
        )?;
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

    /// Exit door one: the rights authority pushes treasury money to a
    /// destination. Adjudicated claims are paid this way. No pool state
    /// changes — the treasury balance is the record.
    pub fn spend(ctx: Context<Spend>, amount: u64) -> Result<()> {
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
            amount,
        )?;
        emit!(events::Spent {
            pool: ctx.accounts.pool.key(),
            destination: ctx.accounts.destination.key(),
            amount,
        });
        Ok(())
    }

    /// Exit door two: the ownership authority permanently ends the pool.
    /// After this only the crank can move money. Terminal.
    pub fn liquidate(ctx: Context<Liquidate>) -> Result<()> {
        let pool = &mut ctx.accounts.pool;
        require!(pool.state == PoolState::Open, PoolError::PoolNotOpen);
        pool.state = PoolState::Liquidated;
        emit!(events::Liquidated { pool: pool.key() });
        Ok(())
    }

    /// Permissionless: pays one depositor its money-weighted share of the
    /// remaining treasury and marks it settled. Exactly once per depositor.
    pub fn crank(ctx: Context<Crank>) -> Result<()> {
        let depositor = &mut ctx.accounts.depositor;
        let paid = instructions::crank::payout(
            ctx.accounts.treasury.amount,
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
            paid,
        });
        Ok(())
    }

    /// Hand one track's powers to a new controller. The current authority of
    /// that track must sign; any pubkey or program PDA is acceptable.
    pub fn update_authority(ctx: Context<UpdateAuthority>, track: Track, new: Pubkey) -> Result<()> {
        ctx.accounts.pool.set_authority(track, new);
        emit!(events::AuthorityUpdated {
            pool: ctx.accounts.pool.key(),
            track,
            new_authority: new,
        });
        Ok(())
    }
}
