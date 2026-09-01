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
//! State/errors/events per §6; instruction set and lifecycle per §7.

pub mod error;
pub mod events;
pub mod instructions;
pub mod state;

pub use error::HanseError;
pub use state::*;

use anchor_lang::prelude::*;

declare_id!("DTSwUuWC1SpZP8LcJ1EJ4HtUxAczqwrsgqNYnR1QXK3p");

#[program]
pub mod hanse {}
