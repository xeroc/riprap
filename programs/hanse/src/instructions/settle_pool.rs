use anchor_lang::prelude::*;
use anchor_spl::token::TokenAccount;

use crate::error::HanseError;
use crate::events::PoolSettled;
use crate::state::{Mutual, Phase};

/// Account context for `settle_pool` — permissionless crank (EVENT-MUTUAL
/// §2.5/§7). Freezes the pro-rata ratio every payout reads.
#[derive(Accounts)]
pub struct SettlePool<'info> {
    /// Anyone — pays tx fees, gains nothing.
    pub cranker: Signer<'info>,

    #[account(
        mut,
        constraint = mutual.phase == Phase::Active @ HanseError::AlreadySettled,
    )]
    pub mutual: Box<Account<'info, Mutual>>,

    /// The pool treasury whose balance sets the ratio. CHECK: must be the
    /// pool's canonical ATA; verified in the handler against mutual.pool +
    /// mutual.deposit_mint (ownership by the token program is enforced by
    /// the type).
    pub treasury: Box<Account<'info, TokenAccount>>,
}

impl<'info> SettlePool<'info> {
    pub fn handler_settle_pool(ctx: Context<SettlePool<'info>>) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let mutual = &ctx.accounts.mutual;

        // §2.5 amendment: settlement waits for the window AND the last
        // dispute — first-come-first-served can never happen.
        require!(now >= mutual.claims_close_at, HanseError::ClaimsWindowOpen);
        require!(
            mutual.claims_filed == mutual.claims_resolved,
            HanseError::ClaimsUnresolved
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

        // ratio_1e9 = min(1e9, vault × 1e9 / (obligations + fee_refunds)) —
        // u128 checked throughout (§2.5); refunds ride the same ratio (§2.6),
        // so one denominator covers both.
        let denominator = u128::from(mutual.obligations)
            .checked_add(u128::from(mutual.fee_refunds))
            .ok_or(HanseError::MathOverflow)?;
        let ratio_1e9 = if denominator == 0 {
            1_000_000_000 // nothing owed: everything is residual
        } else {
            let numerator = u128::from(ctx.accounts.treasury.amount)
                .checked_mul(1_000_000_000)
                .ok_or(HanseError::MathOverflow)?;
            numerator
                .checked_div(denominator)
                .ok_or(HanseError::MathOverflow)?
                .min(1_000_000_000) as u64
        };

        let mutual = &mut ctx.accounts.mutual;
        mutual.ratio_1e9 = ratio_1e9;
        mutual.pull_close_at = now
            .checked_add(mutual.pull_window)
            .ok_or(HanseError::MathOverflow)?;
        mutual.phase = Phase::Settled;

        emit!(PoolSettled {
            mutual: mutual.key(),
            ratio_1e9,
            obligations: mutual.obligations,
            fee_refunds: mutual.fee_refunds,
            pull_close_at: mutual.pull_close_at,
        });
        Ok(())
    }
}
