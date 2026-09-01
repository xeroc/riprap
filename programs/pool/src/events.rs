use anchor_lang::prelude::*;

use crate::state::Track;

/// Emitted on every deposit. Money in, stake minted (handoff DoD).
#[event]
pub struct Deposit {
    pub pool: Pubkey,
    pub depositor: Pubkey,
    pub track: Track,
    pub amount: u64,
    pub stake: u128,
}

/// Emitted on every spend. Door one (handoff DoD).
#[event]
pub struct Spent {
    pub pool: Pubkey,
    pub destination: Pubkey,
    pub amount: u64,
}

/// Emitted once, when the pool is permanently ended. Door two (handoff DoD).
#[event]
pub struct Liquidated {
    pub pool: Pubkey,
}

/// Emitted once per depositor when the crank pays its money-weighted share.
#[event]
pub struct CrankPaid {
    pub pool: Pubkey,
    pub depositor: Pubkey,
    pub paid: u64,
}

/// Emitted when a track's authority changes hands.
#[event]
pub struct AuthorityUpdated {
    pub pool: Pubkey,
    pub track: Track,
    pub new_authority: Pubkey,
}
