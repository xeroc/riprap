use anchor_lang::prelude::*;

/// Mutual lifecycle phase (EVENT-MUTUAL §7): Active → Settled → Dissolved.
/// Deposit and filing gates are the two timestamps; payout and withdrawal
/// gates are this phase.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum Phase {
    Active,
    Settled,
    Dissolved,
}

/// Claim adjudication status (EVENT-MUTUAL §6): Pending until the Dispute
/// reaches a ruling, Approved/Denied by it, Failed when the Accord itself
/// fails (fee refunded), Paid by claim_payout.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub enum ClaimStatus {
    Pending,
    Approved,
    Denied,
    Failed,
    Paid,
}

/// One cover tier (EVENT-MUTUAL §6, policy doc): what joining costs and the
/// only on-chain clamp — file_claim stores min(requested, max_payout).
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug, InitSpace)]
pub struct Tier {
    /// Contribution a member transfers at join; mints the same rights stake.
    pub contribution: u64,
    /// Filing clamp: claim_amount = min(requested, max_payout) — enforced,
    /// not adjudicated (§2.3).
    pub max_payout: u64,
}

/// Payout pull window, fixed for v1 (security review 2026-09-18): 180 days
/// (six 30-day months) after settlement; unpaid amounts then revert to the
/// residual. Deliberately NOT initializer config — an operator-supplied
/// window could overflow settlement's `now + pull_window` (i64::MAX) and
/// strand the pool in Active with no recovery path. 15_552_000 s.
pub const PULL_WINDOW_SECS: i64 = 180 * 86_400;

/// The orchestrator account (EVENT-MUTUAL §6, PDA ["mutual", seed]). Holds
/// the immutable event configuration and — once settle_pool runs — the
/// frozen settlement ratio every payout reads. Custodies no money itself.
#[account]
#[derive(InitSpace)]
pub struct Mutual {
    // ── Immutable, set by initialize_mutual ─────────────────────────────
    /// Initializer — demo admin; gates set_subaccord_param and the payout
    /// pass-check co-signature.
    pub authority: Pubkey,
    /// The pool this mutual owns (rights.authority = mutual_auth PDA,
    /// ownership.authority = mutual_own PDA).
    pub pool: Pubkey,
    /// The Accord subaccord jurors stake into; authority = this Mutual PDA.
    pub subaccord: Pubkey,
    /// USDC for the pilot; contribution and payout mint.
    pub deposit_mint: Pubkey,
    /// USDC for the pilot; juror fees, claimant-funded.
    pub fee_mint: Pubkey,
    /// Cover-terms document hash — the adjudicated reference (§9).
    pub policy_hash: [u8; 32],
    /// The three cover tiers (policy doc: $10/$1k, $20/$2k, $40/$4k).
    pub tiers: [Tier; 3],
    /// Coverage start; join reverts at/after it (§2.7).
    pub deposits_close_at: i64,
    /// Coverage end plus reporting lag; file_claim reverts at/after it (§2.7).
    pub claims_close_at: i64,
    /// Duration after settlement; unpaid amounts revert to the residual
    /// (§2.5). Fixed: always [`PULL_WINDOW_SECS`] — not initializer config.
    pub pull_window: i64,
    /// Restated from the PDA seeds — the mutual PDA signs the create_dispute
    /// CPI (and later pool CPIs), which requires seeds and bump at signing
    /// time (pool `seed` precedent).
    pub seed: u64,
    // ── Settlement, frozen by settle_pool (§2.5) ────────────────────────
    pub phase: Phase,
    /// Set by settle_pool = settled_at + pull_window.
    pub pull_close_at: i64,
    /// 1_000_000_000 = full pay; min(1e9, vault / (obligations + fee_refunds)).
    pub ratio_1e9: u64,
    /// Σ approved claim_amounts.
    pub obligations: u64,
    /// Σ approved fees — refunds ride the same ratio (§2.6).
    pub fee_refunds: u64,
    pub claims_filed: u32,
    pub claims_resolved: u32,
    /// Claim PDA nonce; one claim account per filing.
    pub claim_nonce: u64,
    pub bump: u8,
}

/// One member position (EVENT-MUTUAL §6, PDA ["member", mutual, member]).
#[account]
#[derive(InitSpace)]
pub struct Member {
    pub mutual: Pubkey,
    pub member: Pubkey,
    /// Index into Mutual.tiers; validated at join.
    pub tier: u8,
    /// RESERVED — always Pubkey::default in v1 (SAS integration, bean
    /// riprap-7wa9); the field exists so filling it needs no account-space
    /// migration.
    pub attestation: Pubkey,
    /// One Pending claim per member — the file_claim gate (§7).
    pub has_pending_claim: bool,
    pub bump: u8,
}

/// One filed claim (EVENT-MUTUAL §6, PDA ["claim", mutual, nonce]).
#[account]
#[derive(InitSpace)]
pub struct Claim {
    pub mutual: Pubkey,
    pub member: Pubkey,
    /// Stored = min(requested, tiers[tier].max_payout) — clamped at filing.
    pub claim_amount: u64,
    /// The Accord Dispute (filer = mutual PDA); rulings read from it directly.
    pub dispute: Pubkey,
    /// 3 × fee_per_juror paid into the fee float at filing.
    pub fee_paid: u64,
    pub status: ClaimStatus,
    pub filed_at: i64,
    pub settled_at: i64,
    pub bump: u8,
}

/// PDA domains (EVENT-MUTUAL §6; milestone: program named hanse, domain
/// words stay mutual).
pub const MUTUAL_SEED: &[u8] = b"mutual";
pub const MEMBER_SEED: &[u8] = b"member";
pub const CLAIM_SEED: &[u8] = b"claim";

pub const MUTUAL_SPACE: usize = 8 + Mutual::INIT_SPACE;
pub const MEMBER_SPACE: usize = 8 + Member::INIT_SPACE;
pub const CLAIM_SPACE: usize = 8 + Claim::INIT_SPACE;

#[cfg(test)]
mod tests {
    use super::*;

    /// EVENT-MUTUAL §6: Mutual = immutable block (5 pubkeys + policy_hash 32 +
    /// tiers 3×16 + three i64 timestamps) + settlement block (phase 1 +
    /// pull_close_at 8 + ratio 8 + obligations 8 + fee_refunds 8 +
    /// claims_filed 4 + claims_resolved 4 + claim_nonce 8 + seed 8) + bump 1.
    #[test]
    fn mutual_space_matches_spec_layout() {
        assert_eq!(
            Mutual::INIT_SPACE,
            5 * 32 + 32 + 3 * 16 + 3 * 8 + 8 + 1 + 8 + 8 + 8 + 8 + 4 + 4 + 8 + 1
        );
        assert_eq!(MUTUAL_SPACE, 8 + 322);
    }

    /// EVENT-MUTUAL §6: Member = mutual 32 + member 32 + tier 1 +
    /// attestation 32 (reserved, always default) + has_pending_claim 1 + bump 1.
    #[test]
    fn member_space_matches_spec_layout() {
        assert_eq!(Member::INIT_SPACE, 32 + 32 + 1 + 32 + 1 + 1);
        assert_eq!(MEMBER_SPACE, 8 + 99);
    }

    /// EVENT-MUTUAL §6: Claim = mutual 32 + member 32 + claim_amount 8 +
    /// dispute 32 + fee_paid 8 + status 1 + filed_at 8 + settled_at 8 + bump 1.
    #[test]
    fn claim_space_matches_spec_layout() {
        assert_eq!(Claim::INIT_SPACE, 32 + 32 + 8 + 32 + 8 + 1 + 8 + 8 + 1);
        assert_eq!(CLAIM_SPACE, 8 + 130);
    }

    /// EVENT-MUTUAL §6: Tier = contribution 8 + max_payout 8 (policy doc tiers).
    #[test]
    fn tier_space_matches_spec_layout() {
        assert_eq!(Tier::INIT_SPACE, 8 + 8);
    }

    /// EVENT-MUTUAL §7 lifecycle: Active → Settled → Dissolved, borsh round-trip
    /// keeps the wire u8 mapping (0/1/2) stable.
    #[test]
    fn phase_round_trips() {
        for (i, phase) in [Phase::Active, Phase::Settled, Phase::Dissolved]
            .into_iter()
            .enumerate()
        {
            let bytes = ::borsh::to_vec(&phase).unwrap();
            assert_eq!(bytes, vec![i as u8]);
            let back: Phase = AnchorDeserialize::try_from_slice(&bytes).unwrap();
            assert_eq!(back, phase);
        }
    }

    /// EVENT-MUTUAL §6 claim status ladder: borsh round-trip, wire order
    /// Pending 0 · Approved 1 · Denied 2 · Failed 3 · Paid 4.
    #[test]
    fn claim_status_round_trips() {
        let ladder = [
            ClaimStatus::Pending,
            ClaimStatus::Approved,
            ClaimStatus::Denied,
            ClaimStatus::Failed,
            ClaimStatus::Paid,
        ];
        for (i, status) in ladder.into_iter().enumerate() {
            let bytes = ::borsh::to_vec(&status).unwrap();
            assert_eq!(bytes, vec![i as u8]);
            let back: ClaimStatus = AnchorDeserialize::try_from_slice(&bytes).unwrap();
            assert_eq!(back, status);
        }
    }

    /// EVENT-MUTUAL §6 seeds: PDA domains for the three account families.
    #[test]
    fn seeds_are_the_spec_domains() {
        assert_eq!(MUTUAL_SEED, b"mutual");
        assert_eq!(MEMBER_SEED, b"member");
        assert_eq!(CLAIM_SEED, b"claim");
    }
}
