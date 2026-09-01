use anchor_lang::prelude::*;

/// Emitted on every deposit. Money in, stake minted (handoff DoD).
#[event]
pub struct Deposit {
    pub pool: Pubkey,
    pub depositor: Pubkey,
    pub track: crate::state::Track,
    pub amount: u64,
    pub stake: u128,
}
