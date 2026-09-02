use anchor_lang::prelude::*;

/// Mutual-layer errors (EVENT-MUTUAL §6-§7). Pool-layer concepts stay in the
/// pool program; adjudication internals stay in accord.
#[error_code]
pub enum HanseError {
    // ── initialize_mutual ────────────────────────────────────────────────
    #[msg("Configuration is invalid: tiers must be nonzero and ordered, claims must close after deposits, pull window must be positive")]
    InvalidConfiguration,

    // ── join ─────────────────────────────────────────────────────────────
    #[msg("Deposits are closed: the covered window has started (deposits_close_at)")]
    DepositsClosed,
    #[msg("Tier index out of range: this mutual has exactly three tiers")]
    TierInvalid,
    #[msg("Jury shape invalid: min_jury_size must be odd and its appeal ladder must fit accord's MAX_JURORS")]
    InvalidJurySize,

    // ── file_claim ───────────────────────────────────────────────────────
    #[msg("Claims are closed: the reporting lag has ended (claims_close_at)")]
    ClaimsClosed,
    #[msg("Not a member of this mutual")]
    NotMember,
    #[msg("No rights stake: a member without stake has no cover and cannot file")]
    NoRightsStake,
    #[msg("A pending claim already exists for this member: one at a time")]
    PendingClaimExists,

    // ── settle_claim ─────────────────────────────────────────────────────
    #[msg("The claim is already resolved")]
    ClaimNotPending,
    #[msg("The dispute has not reached a final ruling or failed yet")]
    DisputeNotFinal,

    // ── settle_pool ──────────────────────────────────────────────────────
    #[msg("The claims window is still open: settlement waits until claims_close_at")]
    ClaimsWindowOpen,
    #[msg("Claims are still unresolved: settlement waits for the last dispute")]
    ClaimsUnresolved,
    #[msg("The pool is already settled or dissolved")]
    AlreadySettled,

    // ── claim_payout ─────────────────────────────────────────────────────
    #[msg("The mutual is not in the Settled phase: payouts pull only after settle_pool")]
    NotSettled,
    #[msg("The pull window is closed: unpaid amounts have reverted to the residual")]
    PullWindowClosed,
    #[msg("Only approved claims pay out")]
    ClaimNotApproved,
    #[msg("This claim is already paid — payouts are once")]
    ClaimAlreadyPaid,

    // ── authority gates ──────────────────────────────────────────────────
    #[msg("Unauthorized: this instruction is gated to the mutual authority (admin knob or payout pass-check co-sign)")]
    Unauthorized,

    // ── invariants ───────────────────────────────────────────────────────
    #[msg("Checked math overflowed — the amounts do not fit the accounting")]
    MathOverflow,
    #[msg("The attestation field is reserved: v1 ships stake-only (SAS integration pending)")]
    AttestationReserved,
}
