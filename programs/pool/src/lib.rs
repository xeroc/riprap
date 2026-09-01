//! Pool program — the pool layer of Riprap.
//!
//! Domain language: `CONTEXT.md`. A pool is deposited money with exactly two
//! governed exits — spending and liquidation — and no third path exists.

pub mod instructions;
pub mod state;

use anchor_lang::prelude::*;

pub use instructions::*;
pub use state::*;

declare_id!("63EvHuWaMRSZhD9EPXd7UeW5YFFv41GQUHpv7LpY6wm1");

#[program]
pub mod pool {
    use super::*;
    /// Create a pool PDA at ["pool", seed] with its own treasury ATA (ADR-0001).
    /// Rates are stake minted per unit deposited; zero closes that track.
    pub fn init(ctx: Context<InitPool>, params: InitParams) -> Result<()> {
        init::handler(ctx, params)
    }
}
