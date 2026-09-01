//! Pool program — the pool layer of Riprap.
//!
//! Domain language: `CONTEXT.md`. A pool is deposited money with exactly two
//! governed exits — spending and liquidation — and no third path exists.
//!
//! Layout: one file per instruction in `instructions/*` — the accounts struct
//! plus its `handler_*` impl holding all logic. The `#[program]` bodies here
//! are one-line delegates (the Accord seam).

pub mod error;
pub mod events;
pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

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
        InitPool::handler_init(ctx, params)
    }

    /// Deposit into one track; mints stake at that track's rate and moves the
    /// money into the treasury. The only way money enters.
    pub fn deposit(ctx: Context<Deposit>, track: Track, amount: u64) -> Result<()> {
        Deposit::handler_deposit(ctx, track, amount)
    }

    /// Exit door one: the rights authority pushes treasury money to a
    /// destination. Adjudicated claims are paid this way. No pool state
    /// changes — the treasury balance is the record.
    pub fn spend(ctx: Context<Spend>, amount: u64) -> Result<()> {
        Spend::handler_spend(ctx, amount)
    }

    /// Exit door two: the ownership authority permanently ends the pool.
    /// After this only the crank can move money. Terminal.
    pub fn liquidate(ctx: Context<Liquidate>) -> Result<()> {
        Liquidate::handler_liquidate(ctx)
    }

    /// Permissionless: pays one depositor its money-weighted share of the
    /// remaining treasury and marks it settled. Exactly once per depositor.
    pub fn crank(ctx: Context<Crank>) -> Result<()> {
        Crank::handler_crank(ctx)
    }

    /// Hand one track's powers to a new controller. The current authority of
    /// that track must sign; any pubkey or program PDA is acceptable.
    pub fn update_authority(ctx: Context<UpdateAuthority>, track: Track, new: Pubkey) -> Result<()> {
        UpdateAuthority::handler_update_authority(ctx, track, new)
    }
}
