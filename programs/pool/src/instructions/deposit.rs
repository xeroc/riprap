use anchor_lang::prelude::*;
use anchor_spl::token::{self, Token, TokenAccount};

use crate::error::PoolError;
use crate::events;
use crate::state::*;

/// Pure deposit accounting — everything except the SPL transfer, so the
/// handoff test matrix rows are unit-testable without a runtime.
/// Returns the stake minted (checked math everywhere, handoff §3).
pub(crate) fn apply(
    pool: &mut Pool,
    depositor: &mut Depositor,
    track: Track,
    amount: u64,
) -> Result<u128> {
    require!(pool.state == PoolState::Open, PoolError::PoolNotOpen);
    let rate = pool.rate(track);
    require!(rate > 0, PoolError::TrackClosed);
    require!(!depositor.settled, PoolError::Settled);

    let stake = (amount as u128)
        .checked_mul(rate as u128)
        .ok_or(PoolError::MathOverflow)?;

    depositor.total_amount = depositor
        .total_amount
        .checked_add(amount)
        .ok_or(PoolError::MathOverflow)?;
    match track {
        Track::Ownership => {
            depositor.ownership_stake = depositor
                .ownership_stake
                .checked_add(stake)
                .ok_or(PoolError::MathOverflow)?;
        }
        Track::Rights => {
            depositor.rights_stake = depositor
                .rights_stake
                .checked_add(stake)
                .ok_or(PoolError::MathOverflow)?;
        }
        Track::Yield => {
            depositor.yield_stake = depositor
                .yield_stake
                .checked_add(stake)
                .ok_or(PoolError::MathOverflow)?;
        }
    }
    pool.total_amount = pool
        .total_amount
        .checked_add(amount as u128)
        .ok_or(PoolError::MathOverflow)?;
    Ok(stake)
}

#[derive(Accounts)]
pub struct Deposit<'info> {
    #[account(
        mut,
        constraint = pool.state == PoolState::Open @ PoolError::PoolNotOpen
    )]
    pub pool: Account<'info, Pool>,

    /// One depositor position per pool per party (handoff §2 seeds).
    #[account(
        init_if_needed,
        payer = rent_payer,
        space = DEPOSITOR_SPACE,
        seeds = [b"depositor", pool.key().as_ref(), owner.key().as_ref()],
        bump,
        constraint = !depositor.settled @ PoolError::Settled
    )]
    pub depositor: Account<'info, Depositor>,
    pub owner: Signer<'info>,

    /// Optional funds sponsor: when present, `owner_ata` must belong to this
    /// key and the position's liquidation residual is assigned to it (first
    /// deposit only, immutable after). Grants nothing else — the position
    /// stays bound to the owner by seeds; spend/burn/payout never read it.
    pub funder: Option<Signer<'info>>,

    /// Sponsors rent for the depositor PDA on first deposit — anyone. Paying
    /// grants no rights: seeds bind the position to the owner alone.
    #[account(mut)]
    pub rent_payer: Signer<'info>,

    /// Deposit source; must hold the pool's one token and belong to the
    /// owner, or to the funder when one sponsors (handler-checked).
    #[account(mut, token::mint = pool.mint)]
    pub owner_ata: Account<'info, TokenAccount>,

    /// Treasury: pool PDA's ATA. Deposits were never swig-gated (ADR-0001).
    /// Treasury: must be THIS pool's canonical ATA (mint + authority = pool),
    /// so money can never land in or leave another pool's treasury.
    #[account(
        mut,
        associated_token::mint = pool.mint,
        associated_token::authority = pool,
    )]
    pub treasury: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
}

impl<'info> Deposit<'info> {
    /// Deposit into one track; mints stake at that track's rate and moves the
    /// money into the treasury. The only way money enters. With a funder,
    /// the sponsor's money buys the owner's position and the sponsor's
    /// residual share — never the owner's claim rights.
    pub fn handler_deposit(ctx: Context<Deposit>, track: Track, amount: u64) -> Result<()> {
        // Freshness read before any writes: a zeroed owner field is only
        // possible on the just-created account (Pubkey::default cannot sign,
        // so no live position ever carries it).
        let fresh = ctx.accounts.depositor.owner == Pubkey::default();

        // Source authority: the owner's own ATA, or the funder's when a
        // sponsor pays. The beneficiary assignment rides the same decision.
        let (beneficiary, source_authority) = match &ctx.accounts.funder {
            Some(funder) => {
                require_keys_eq!(
                    ctx.accounts.owner_ata.owner,
                    funder.key(),
                    PoolError::WrongSourceAuthority
                );
                (funder.key(), funder.to_account_info())
            }
            None => {
                require_keys_eq!(
                    ctx.accounts.owner_ata.owner,
                    ctx.accounts.owner.key(),
                    PoolError::WrongSourceAuthority
                );
                (Pubkey::default(), ctx.accounts.owner.to_account_info())
            }
        };

        // Stake math and bookkeeping before the transfer — no state changes if it reverts.
        let stake = apply(&mut ctx.accounts.pool, &mut ctx.accounts.depositor, track, amount)?;
        let owner = ctx.accounts.owner.key();
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.key(),
                token::Transfer {
                    from: ctx.accounts.owner_ata.to_account_info(),
                    to: ctx.accounts.treasury.to_account_info(),
                    authority: source_authority,
                },
            ),
            amount,
        )?;
        // init_if_needed: owner is only set meaningfully on first creation.
        ctx.accounts.depositor.owner = owner;
        // First deposit fixes the residual assignment; later deposits must
        // come from the same side — a self-funded position can never be
        // retroactively sponsored, nor a sponsored one topped up by its owner
        // (that money would silently exit to the sponsor).
        if fresh {
            ctx.accounts.depositor.residual_beneficiary = beneficiary;
        } else {
            require!(
                ctx.accounts.depositor.residual_beneficiary == beneficiary,
                PoolError::BeneficiaryImmutable
            );
        }
        emit!(events::Deposit {
            pool: ctx.accounts.pool.key(),
            depositor: owner,
            track,
            amount,
            stake,
        });
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    use anchor_lang::error::ERROR_CODE_OFFSET;

    fn code(err: anchor_lang::error::Error) -> u32 {
        match err {
            anchor_lang::error::Error::AnchorError(ae) => ae.error_code_number,
            _ => panic!("expected AnchorError"),
        }
    }

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
            liquidation_balance: 0,
        }
    }

    fn depositor() -> Depositor {
        Depositor {
            owner: Pubkey::new_unique(),
            residual_beneficiary: Pubkey::default(),
            total_amount: 0,
            ownership_stake: 0,
            rights_stake: 0,
            yield_stake: 0,
            settled: false,
        }
    }

    /// Test matrix: Open pool, rights_rate=1, deposit 20 USDC (20e6 base)
    /// → depositor.total=20e6, rights_stake=20e6, pool.total=20e6.
    #[test]
    fn deposit_20_usdc_rights_rate_1() {
        let mut p = pool();
        let mut d = depositor();
        let stake = apply(&mut p, &mut d, Track::Rights, 20_000_000).unwrap();
        assert_eq!(stake, 20_000_000);
        assert_eq!(d.total_amount, 20_000_000);
        assert_eq!(d.rights_stake, 20_000_000);
        assert_eq!(p.total_amount, 20_000_000);
    }

    /// Test matrix: rights_rate=0, deposit(Rights) → TrackClosed.
    /// ownership_rate=0 in the fixture covers the ownership variant.
    #[test]
    fn closed_track_reverts() {
        let mut p = pool();
        let mut d = depositor();
        // ownership track has rate 0 in the fixture; zero out rights too
        p.rights_rate = 0;
        let err = apply(&mut p, &mut d, Track::Ownership, 1).unwrap_err();
        let err0 = apply(&mut p, &mut d, Track::Rights, 1).unwrap_err();
        assert_eq!(code(err), PoolError::TrackClosed as u32 + ERROR_CODE_OFFSET);
        assert_eq!(code(err0), PoolError::TrackClosed as u32 + ERROR_CODE_OFFSET);
    }

    /// Test matrix: Liquidated pool, deposit → revert (PoolNotOpen).
    #[test]
    fn liquidated_pool_reverts() {
        let mut p = pool();
        p.state = PoolState::Liquidated;
        let mut d = depositor();
        let err = apply(&mut p, &mut d, Track::Rights, 1).unwrap_err();
        assert_eq!(code(err), PoolError::PoolNotOpen as u32 + ERROR_CODE_OFFSET);
    }

    /// CONTEXT.md Settled: a settled depositor cannot deposit again.
    #[test]
    fn settled_depositor_reverts() {
        let mut p = pool();
        let mut d = depositor();
        d.settled = true;
        let err = apply(&mut p, &mut d, Track::Rights, 1).unwrap_err();
        assert_eq!(code(err), PoolError::Settled as u32 + ERROR_CODE_OFFSET);
    }

    /// Stake is minted at the track rate and accumulates per track (handoff §2).
    #[test]
    fn stake_accumulates_per_track() {
        let mut p = pool();
        let mut d = depositor();
        apply(&mut p, &mut d, Track::Rights, 100).unwrap(); // rate 1
        apply(&mut p, &mut d, Track::Yield, 100).unwrap(); // rate 2
        apply(&mut p, &mut d, Track::Rights, 100).unwrap();
        assert_eq!(d.rights_stake, 200);
        assert_eq!(d.yield_stake, 200);
        assert_eq!(d.total_amount, 300);
        assert_eq!(p.total_amount, 300);
    }

    /// Handoff §3: checked math everywhere — stake addition overflow reverts.
    #[test]
    fn stake_overflow_reverts() {
        let mut p = pool();
        p.yield_rate = u64::MAX;
        let mut d = depositor();
        d.yield_stake = u128::MAX - 1;
        let err = apply(&mut p, &mut d, Track::Yield, u64::MAX).unwrap_err();
        assert_eq!(code(err), PoolError::MathOverflow as u32 + ERROR_CODE_OFFSET);
    }
}
