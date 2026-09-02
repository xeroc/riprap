//! Hanse program — the event mutual orchestrator (internal codename "Hanse";
//! public brand is Riprap).
//!
//! Implements `meta/specs/EVENT-MUTUAL.md` (grilled consensus 2026-08-30):
//! a bounded-lifetime mutual — members contribute once before a covered
//! window opens (§2.7), qualifying incidents produce claims adjudicated by
//! the Accord (§2.3), approved claims pay from the shared pool at a frozen
//! pro-rata ratio (§2.5), whatever remains returns pro-rata, and the mutual
//! dissolves permanently (§2.7). One deposit, one window, one settlement.
//!
//! The mutual custodies nothing itself: money lives in the pool program's
//! treasury and moves only through the two governed exits (§2.2, §2.4) —
//! `pool.spend` for adjudicated payouts, liquidation for the residual.
//! Adjudication rides the Accord: disputes are filed via CPI (§2.6) and
//! rulings are read directly from the Dispute account (canon settle_item
//! pattern) — no `get_ruling` round-trip.
//!
//! Layout: one file per instruction in `instructions/*` — the accounts
//! struct plus its `handler_*` impl holding all logic. The `#[program]`
//! bodies are one-line delegates (house style, see `programs/pool`).

pub mod error;
pub mod events;
pub mod instructions;
pub mod state;

pub use error::HanseError;
pub use instructions::*;
pub use state::*;

use anchor_lang::prelude::*;

declare_id!("DTSwUuWC1SpZP8LcJ1EJ4HtUxAczqwrsgqNYnR1QXK3p");

#[program]
pub mod hanse {
    use super::*;

    /// Create the mutual: wires pool (rights 1:1 under mutual_auth, ownership
    /// disabled under mutual_own), subaccord (Plurality, mutual PDA as
    /// authority), and the fee float (§7). Permissionless; the initializer is
    /// recorded as the demo admin.
    pub fn initialize_mutual(
        ctx: Context<InitializeMutual>,
        config: InitializeMutualConfig,
    ) -> Result<()> {
        InitializeMutual::handler_initialize_mutual(ctx, config)
    }

    /// Member-signed entry: one contribution before deposits close, one tier,
    /// one rights stake (§7). The Member PDA init IS the anti-stacking gate.
    pub fn join(ctx: Context<Join>, tier: u8) -> Result<()> {
        Join::handler_join(ctx, tier)
    }

    /// Member-signed filing: one claim at a time, clamped at the tier cap,
    /// fee claimant-funded, dispute opened by the mutual PDA (§7).
    pub fn file_claim(
        ctx: Context<FileClaim>,
        requested: u64,
        evidence_hash: [u8; 32],
        nonce: u64,
    ) -> Result<()> {
        FileClaim::handler_file_claim(ctx, requested, evidence_hash, nonce)
    }

    /// Permissionless: reads the Dispute ruling directly and books the claim
    /// Approved / Denied / Failed (§7). Moves no pool funds except the
    /// Failed fee refund.
    pub fn settle_claim(ctx: Context<SettleClaim>) -> Result<()> {
        SettleClaim::handler_settle_claim(ctx)
    }
}
