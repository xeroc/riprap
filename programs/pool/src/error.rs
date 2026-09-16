use anchor_lang::prelude::*;

/// Pool-layer errors. Claims-layer concepts never appear here (CONTEXT.md).
#[error_code]
pub enum PoolError {
    #[msg("Deposits are refused: the pool is not open")]
    PoolNotOpen,
    #[msg("The crank only runs after liquidation")]
    PoolNotLiquidated,
    #[msg("The track is closed: its stake rate is zero, deposits cannot mint stake")]
    TrackClosed,
    #[msg("This depositor is settled: it cannot deposit again")]
    Settled,
    #[msg("The deposit source ATA must belong to the owner or the passing funder")]
    WrongSourceAuthority,
    #[msg("The residual beneficiary was set at first deposit and cannot change")]
    BeneficiaryImmutable,
    #[msg("The crank destination must be the owner's or the beneficiary's canonical ATA")]
    WrongDestination,
    #[msg("Checked math overflowed — the amounts do not fit the accounting")]
    MathOverflow,
}
