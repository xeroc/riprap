use anchor_lang::prelude::*;

/// Claim dimension of a pool. One per stake rate and authority.
/// Avoid: tranche, class (CONTEXT.md, Track).
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum Track {
    Ownership,
    Rights,
    Yield,
}

/// A pool is Open until the ownership authority liquidates it. Terminal.
/// Avoid: close, dissolution (CONTEXT.md, Liquidation).
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum PoolState {
    Open,
    Liquidated,
}

/// A collection of deposited money with exactly two governed exits —
/// spending and liquidation. No third path exists (CONTEXT.md, Pool).
///
/// Layout is the handoff §2 data contract; POOL_SPACE assertions in the
/// tests below pin it.
#[account]
#[derive(InitSpace)]
pub struct Pool {
    /// The single token this pool accepts; deposits of anything else are impossible.
    pub mint: Pubkey,
    pub state: PoolState,
    /// Stake minted per unit deposited into each track. Zero = track CLOSED
    /// (deposits into it revert). Never "donation" semantics.
    pub ownership_rate: u64,
    pub rights_rate: u64,
    pub yield_rate: u64,
    /// Controllers of each track's powers; may be any key or program PDA.
    pub ownership_authority: Pubkey,
    pub rights_authority: Pubkey,
    pub yield_authority: Pubkey,
    /// Sum of all depositor totals. Liquidation shares are money-weighted
    /// against this, never stake-weighted.
    pub total_amount: u128,
    /// Restated from the PDA seeds: the pool PDA signs outbound treasury
    /// transfers (spend, crank), which requires seeds and bump at spend time.
    pub seed: u64,
    pub bump: u8,
}

impl Pool {
    /// Stake rate of one track. Zero means the track is closed.
    pub fn rate(&self, track: Track) -> u64 {
        match track {
            Track::Ownership => self.ownership_rate,
            Track::Rights => self.rights_rate,
            Track::Yield => self.yield_rate,
        }
    }

    /// The authority governing one track's powers.
    pub fn authority(&self, track: Track) -> Pubkey {
        match track {
            Track::Ownership => self.ownership_authority,
            Track::Rights => self.rights_authority,
            Track::Yield => self.yield_authority,
        }
    }
}

/// One depositor position per pool per party (CONTEXT.md, Depositor).
#[account]
#[derive(InitSpace)]
pub struct Depositor {
    pub owner: Pubkey,
    /// Total this party deposited; its money-weighted liquidation numerator.
    pub total_amount: u64,
    /// Stake minted at deposit time, per track. Frozen at the rate of deposit.
    pub ownership_stake: u128,
    pub rights_stake: u128,
    pub yield_stake: u128,
    /// A settled depositor cannot deposit again or receive another payout.
    pub settled: bool,
}

pub const POOL_SPACE: usize = 8 + Pool::INIT_SPACE;
pub const DEPOSITOR_SPACE: usize = 8 + Depositor::INIT_SPACE;

#[cfg(test)]
mod tests {
    use super::*;

    fn pool() -> Pool {
        Pool {
            mint: Pubkey::default(),
            state: PoolState::Open,
            ownership_rate: 0,
            rights_rate: 1,
            yield_rate: 2,
            ownership_authority: Pubkey::new_unique(),
            rights_authority: Pubkey::new_unique(),
            yield_authority: Pubkey::new_unique(),
            total_amount: 0,
            seed: 0,
            bump: 255,
        }
    }

    /// Handoff §2: Pool = mint 32 + state 1 + rates 3×8 + authorities 3×32 +
    /// total 16 + seed 8 + bump 1 (seed/bump restated so the PDA can sign).
    #[test]
    fn pool_space_matches_handoff_layout() {
        assert_eq!(Pool::INIT_SPACE, 32 + 1 + 3 * 8 + 3 * 32 + 16 + 8 + 1);
        assert_eq!(POOL_SPACE, 8 + 178);
    }

    /// Handoff §2: Depositor = owner 32 + total 8 + stakes 3×16 + settled 1.
    #[test]
    fn depositor_space_matches_handoff_layout() {
        assert_eq!(Depositor::INIT_SPACE, 32 + 8 + 3 * 16 + 1);
        assert_eq!(DEPOSITOR_SPACE, 8 + 89);
    }

    /// Handoff §2 / pseudo-code: rate lookup per track, 0 = closed.
    #[test]
    fn rate_maps_each_track() {
        let p = pool();
        assert_eq!(p.rate(Track::Ownership), 0);
        assert_eq!(p.rate(Track::Rights), 1);
        assert_eq!(p.rate(Track::Yield), 2);
    }

    #[test]
    fn authority_maps_each_track() {
        let p = pool();
        assert_eq!(p.authority(Track::Ownership), p.ownership_authority);
        assert_eq!(p.authority(Track::Rights), p.rights_authority);
        assert_eq!(p.authority(Track::Yield), p.yield_authority);
    }
}
