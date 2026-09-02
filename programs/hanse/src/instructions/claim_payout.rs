use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::error::HanseError;
use crate::events::PayoutClaimed;
use crate::state::{Claim, ClaimStatus, Mutual, Phase};

/// Account context for `claim_payout` — the claimant pull, idempotent
/// (EVENT-MUTUAL §2.4/§7). Atomic: spend + burn in one transaction.
#[derive(Accounts)]
pub struct ClaimPayout<'info> {
    #[account(mut)]
    pub claimant: Signer<'info>,

    /// Breakpoint pass gate (§2.10 amendment / §12): passes are verified
    /// off-chain, so the gate sits at payout as the authority's co-signature.
    pub authority: Signer<'info>,

    #[account(
        constraint = mutual.phase == Phase::Settled @ HanseError::NotSettled,
    )]
    pub mutual: Box<Account<'info, Mutual>>,

    #[account(
        mut,
        constraint = claim.mutual == mutual.key() @ HanseError::NotMember,
        constraint = claim.member == claimant.key() @ HanseError::NotClaimant,
        constraint = matches!(claim.status, ClaimStatus::Approved | ClaimStatus::Paid)
            @ HanseError::ClaimNotApproved,
    )]
    pub claim: Box<Account<'info, Claim>>,

    /// The mutual's rights authority over its pool — PDA ["mutual_auth",
    /// mutual] under this program; signs both CPIs.
    /// CHECK: seeds-verified here; the pool re-checks it equals its recorded
    /// rights authority inside the CPIs.
    #[account(seeds = [b"mutual_auth", mutual.key().as_ref()], bump)]
    pub rights_authority: UncheckedAccount<'info>,

    /// CHECK: must be exactly `mutual.pool`; the pool program re-checks its
    /// own accounts inside both CPIs.
    #[account(mut, constraint = pool.key() == mutual.pool @ HanseError::WrongPool)]
    pub pool: UncheckedAccount<'info>,

    /// The claimant's pool position. CHECK: PDA ["depositor", pool, member]
    /// under the pool program, verified in the handler; owner by the type.
    #[account(mut)]
    pub depositor: Box<Account<'info, pool::Depositor>>,

    /// The pool treasury — payout source. CHECK: canonical pool ATA, verified
    /// in the handler; the spend CPI re-checks mint/authority.
    #[account(mut)]
    pub treasury: Box<Account<'info, TokenAccount>>,

    /// The claimant's canonical deposit-mint ATA — payout destination.
    #[account(
        mut,
        associated_token::authority = claimant,
        associated_token::mint = deposit_mint,
    )]
    pub destination: Box<Account<'info, TokenAccount>>,

    #[account(constraint = deposit_mint.key() == mutual.deposit_mint @ HanseError::WrongMint)]
    pub deposit_mint: Box<Account<'info, Mint>>,

    pub token_program: Program<'info, Token>,
    /// CHECK: address-constrained to the pool program id.
    #[account(address = pool::ID)]
    pub pool_program: UncheckedAccount<'info>,
}

impl<'info> ClaimPayout<'info> {
    pub fn handler_claim_payout(ctx: Context<ClaimPayout<'info>>) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let mutual = &ctx.accounts.mutual;

        // Idempotence first: a Paid claim re-pulling gets the precise error,
        // not the broad ClaimNotApproved.
        require!(
            ctx.accounts.claim.status == ClaimStatus::Approved,
            HanseError::ClaimAlreadyPaid
        );

        // Pass co-sign: the initializer's key must sign alongside the
        // claimant (§2.10 amendment — off-chain pass validation).
        require_keys_eq!(
            ctx.accounts.authority.key(),
            mutual.authority,
            HanseError::Unauthorized
        );
        // Pull window: unpaid amounts revert to the residual after this.
        require!(now < mutual.pull_close_at, HanseError::PullWindowClosed);

        // Depositor + treasury PDA/address checks before the money moves.
        let expected_depositor = Pubkey::find_program_address(
            &[
                b"depositor",
                mutual.pool.as_ref(),
                ctx.accounts.claimant.key().as_ref(),
            ],
            &pool::ID,
        )
        .0;
        require_keys_eq!(
            ctx.accounts.depositor.key(),
            expected_depositor,
            HanseError::WrongDepositor
        );
        let expected_treasury = anchor_spl::associated_token::get_associated_token_address(
            &mutual.pool,
            &mutual.deposit_mint,
        );
        require_keys_eq!(
            ctx.accounts.treasury.key(),
            expected_treasury,
            HanseError::WrongTreasury
        );

        // payout = claim_amount × ratio / 1e9 + fee_paid × ratio / 1e9 —
        // u128 intermediates, each term floored (§7; §8: $2,015 solvent,
        // $1,323.40 + $9.93 exhausted).
        let r = u128::from(mutual.ratio_1e9);
        let claim_part = u128::from(ctx.accounts.claim.claim_amount)
            .checked_mul(r)
            .and_then(|v| v.checked_div(1_000_000_000))
            .ok_or(HanseError::MathOverflow)?;
        let fee_part = u128::from(ctx.accounts.claim.fee_paid)
            .checked_mul(r)
            .and_then(|v| v.checked_div(1_000_000_000))
            .ok_or(HanseError::MathOverflow)?;
        let payout = claim_part
            .checked_add(fee_part)
            .and_then(|v| u64::try_from(v).ok())
            .ok_or(HanseError::MathOverflow)?;

        // Burn saturates at the member's contribution (§2.4: a paid claimant
        // exits the residual — never burns more than it put in).
        let burn_amount = payout.min(ctx.accounts.depositor.total_amount);

        // Both CPIs sign with the ["mutual_auth", mutual] PDA (the pool's
        // recorded rights authority).
        let mutual_key = mutual.key();
        let signer_seeds: &[&[&[u8]]] = &[&[
            b"mutual_auth",
            mutual_key.as_ref(),
            &[ctx.bumps.rights_authority],
        ]];

        // Door one: spend the payout out of the treasury to the claimant.
        pool::cpi::spend(
            CpiContext::new_with_signer(
                ctx.accounts.pool_program.key(),
                pool::cpi::accounts::Spend {
                    pool: ctx.accounts.pool.to_account_info(),
                    rights_authority: ctx.accounts.rights_authority.to_account_info(),
                    treasury: ctx.accounts.treasury.to_account_info(),
                    destination: ctx.accounts.destination.to_account_info(),
                    token_program: ctx.accounts.token_program.to_account_info(),
                },
                signer_seeds,
            ),
            payout,
        )?;

        // Residual exit: burn the paid claimant's stake (money-weighted
        // crank then reproduces §8 exactly).
        pool::cpi::burn(
            CpiContext::new_with_signer(
                ctx.accounts.pool_program.key(),
                pool::cpi::accounts::Burn {
                    pool: ctx.accounts.pool.to_account_info(),
                    authority: ctx.accounts.rights_authority.to_account_info(),
                    depositor: ctx.accounts.depositor.to_account_info(),
                    owner: ctx.accounts.claimant.to_account_info(),
                },
                signer_seeds,
            ),
            pool::Track::Rights,
            burn_amount,
        )?;

        ctx.accounts.claim.status = ClaimStatus::Paid;

        emit!(PayoutClaimed {
            mutual: mutual.key(),
            claim: ctx.accounts.claim.key(),
            member: ctx.accounts.claimant.key(),
            paid: payout,
        });
        Ok(())
    }
}
