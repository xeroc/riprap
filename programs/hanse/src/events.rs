//! One event per lifecycle transition (EVENT-MUTUAL §7). set_subaccord_param's
//! event ships with its instruction bean — its parameter type is defined there,
//! not here.
use anchor_lang::prelude::*;

use crate::state::ClaimStatus;

/// Emitted once by initialize_mutual: the mutual exists, pool and subaccord wired.
#[event]
pub struct MutualInitialized {
    pub mutual: Pubkey,
    pub authority: Pubkey,
    pub pool: Pubkey,
    pub subaccord: Pubkey,
}

/// Emitted on every join: money in, member enrolled, rights stake minted.
#[event]
pub struct MemberJoined {
    pub mutual: Pubkey,
    pub member: Pubkey,
    pub tier: u8,
    pub contribution: u64,
}

/// Emitted on every filing: claim clamped, fee funded, dispute opened.
#[event]
pub struct ClaimFiled {
    pub mutual: Pubkey,
    pub claim: Pubkey,
    pub member: Pubkey,
    /// min(requested, tiers[tier].max_payout) as stored.
    pub claim_amount: u64,
    pub fee_paid: u64,
    pub dispute: Pubkey,
}

/// Emitted when a claim's dispute resolves: Approved (fee refund owed),
/// Denied (fee stays with jurors), or Failed (fee refunded by accord).
#[event]
pub struct ClaimSettled {
    pub mutual: Pubkey,
    pub claim: Pubkey,
    pub status: ClaimStatus,
    pub claim_amount: u64,
    pub fee_paid: u64,
}

/// Emitted once by settle_pool: the ratio freezes, the pull window opens.
#[event]
pub struct PoolSettled {
    pub mutual: Pubkey,
    pub ratio_1e9: u64,
    pub obligations: u64,
    pub fee_refunds: u64,
    pub pull_close_at: i64,
}

/// Emitted on each claimant pull: payout = (claim_amount + fee) × ratio.
#[event]
pub struct PayoutClaimed {
    pub mutual: Pubkey,
    pub claim: Pubkey,
    pub member: Pubkey,
    pub paid: u64,
}

/// Emitted once by dissolve: the mutual is permanently ended; the residual
/// crank belongs to the pool now.
#[event]
pub struct MutualDissolved {
    pub mutual: Pubkey,
}

/// Emitted on every admin param proposal (§7; 48h timelock is accord-side).
#[event]
pub struct SubaccordParamSet {
    pub mutual: Pubkey,
    pub subaccord: Pubkey,
    pub nonce: u64,
    pub payload: accord::state::UpdatePayload,
}
