//! Pool program — the pool layer of Riprap.
//!
//! Domain language: `CONTEXT.md`. A pool is deposited money with exactly two
//! governed exits — spending and liquidation — and no third path exists.

use anchor_lang::prelude::*;

declare_id!("63EvHuWaMRSZhD9EPXd7UeW5YFFv41GQUHpv7LpY6wm1");

#[program]
pub mod pool {}
