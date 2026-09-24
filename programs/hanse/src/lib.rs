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
pub mod sas;
pub mod state;

pub use error::HanseError;
pub use instructions::*;
pub use state::*;

use anchor_lang::prelude::*;

declare_id!("hanseP4mdA6Df5TXkd3cDLKPaFqzE4PNJAGKkkvgqav");

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

    /// Permissionless: after the window AND the last dispute, freezes the
    /// pro-rata ratio and opens the pull window (§2.5). Every payout reads
    /// the frozen ratio.
    pub fn settle_pool(ctx: Context<SettlePool>) -> Result<()> {
        SettlePool::handler_settle_pool(ctx)
    }

    /// Demo admin lever: propose a subaccord parameter change through the
    /// accord 48h timelock (§7). The mutual PDA signs as the subaccord's
    /// authority; the admin wallet pays rent.
    pub fn set_subaccord_param(
        ctx: Context<SetSubaccordParam>,
        nonce: u64,
        param: SubaccordParam,
    ) -> Result<()> {
        SetSubaccordParam::handler_set_subaccord_param(ctx, nonce, param)
    }

    /// Permissionless payout crank against the frozen ratio — authority-gated
    /// for the pilot pass check; atomic spend + burn (§7).
    pub fn claim_payout(ctx: Context<ClaimPayout>) -> Result<()> {
        ClaimPayout::handler_claim_payout(ctx)
    }

    /// Permissionless, terminal: after the pull window, liquidate the pool
    /// from the mutual_own PDA — the residual belongs to the pool crank
    /// directly (§7).
    pub fn dissolve(ctx: Context<Dissolve>) -> Result<()> {
        Dissolve::handler_dissolve(ctx)
    }
}
