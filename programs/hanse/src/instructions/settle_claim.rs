use anchor_lang::prelude::*;

use crate::error::HanseError;
use crate::events::ClaimSettled;
use crate::state::{Claim, ClaimStatus, Member, Mutual};

/// Account context for `settle_claim` — permissionless crank (EVENT-MUTUAL
/// §7). Moves no funds: both payout paths (Approved claim + fee, Failed fee)
/// ride the settlement ratio and pay at `claim_payout` (amendment
/// 2026-09-25, audit H-2: the float never backs a per-claim transfer here —
/// accord's Failed refund is whatever it is, and the claimant is made whole
/// at ratio instead).
#[derive(Accounts)]
pub struct SettleClaim<'info> {
    /// Anyone — pays tx fees, gains nothing (permissionless crank).
    pub cranker: Signer<'info>,

    #[account(mut)]
    pub mutual: Box<Account<'info, Mutual>>,

    #[account(
        mut,
        constraint = claim.mutual == mutual.key() @ HanseError::NotMember,
        constraint = claim.status == ClaimStatus::Pending @ HanseError::ClaimNotPending,
    )]
    pub claim: Box<Account<'info, Claim>>,

    #[account(
        mut,
        seeds = [crate::state::MEMBER_SEED, mutual.key().as_ref(), claim.member.as_ref()],
        bump,
    )]
    pub member_account: Box<Account<'info, Member>>,

    /// The ruling, read directly — no get_ruling CPI (canon settle_item
    /// pattern). Ownership by the accord program is enforced by the type.
    #[account(constraint = dispute.key() == claim.dispute @ HanseError::WrongDispute)]
    pub dispute: Box<Account<'info, accord::state::Dispute>>,
}

impl<'info> SettleClaim<'info> {
    pub fn handler_settle_claim(ctx: Context<SettleClaim<'info>>) -> Result<()> {
        let now = Clock::get()?.unix_timestamp;
        let mutual_key = ctx.accounts.mutual.key();
        let dispute = &ctx.accounts.dispute;

        let status = match dispute.state {
            accord::state::DisputeState::Final => match dispute.final_ruling {
                0 => {
                    // Approve (option index 0): payout owed, fee refunded with
                    // it through the settlement ratio.
                    let m = &mut ctx.accounts.mutual;
                    m.obligations = m
                        .obligations
                        .checked_add(ctx.accounts.claim.claim_amount)
                        .ok_or(HanseError::MathOverflow)?;
                    m.fee_refunds = m
                        .fee_refunds
                        .checked_add(ctx.accounts.claim.fee_paid)
                        .ok_or(HanseError::MathOverflow)?;
                    ClaimStatus::Approved
                }
                1 => ClaimStatus::Denied, // fee stays with the jurors
                _ => return err!(HanseError::UnexpectedRuling),
            },
            accord::state::DisputeState::Failed => {
                // Liveness escape, ratio-routed (amendment 2026-09-25, audit
                // H-2): accord refunds whatever it refunds into the float —
                // hanse never measures it. The claimant is made whole on the
                // fee through the settlement ratio, exactly like an approved
                // fee; the float itself is swept into the treasury at
                // settle_pool. No transfer here, no float dependency.
                let m = &mut ctx.accounts.mutual;
                m.fee_refunds = m
                    .fee_refunds
                    .checked_add(ctx.accounts.claim.fee_paid)
                    .ok_or(HanseError::MathOverflow)?;
                ClaimStatus::Failed
            }
            // Everything else is still live: appeals, redraws, unstarted.
            _ => return err!(HanseError::DisputeNotFinal),
        };
        // Denied/Failed claims are unpaid — release their tier-cap
        // reservation so only Approved (owed) claims consume the
        // membership cap (audit H-1 fix 2026-09-24).
        if status != ClaimStatus::Approved {
            ctx.accounts.member_account.cap_used = ctx
                .accounts
                .member_account
                .cap_used
                .checked_sub(ctx.accounts.claim.claim_amount)
                .ok_or(HanseError::MathOverflow)?;
        }

        ctx.accounts.claim.status = status;
        ctx.accounts.claim.settled_at = now;
        ctx.accounts.mutual.claims_resolved += 1;
        ctx.accounts.member_account.has_pending_claim = false;

        emit!(ClaimSettled {
            mutual: mutual_key,
            claim: ctx.accounts.claim.key(),
            status,
            claim_amount: ctx.accounts.claim.claim_amount,
            fee_paid: ctx.accounts.claim.fee_paid,
        });
        Ok(())
    }
}
