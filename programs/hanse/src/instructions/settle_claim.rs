use anchor_lang::prelude::*;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::error::HanseError;
use crate::events::ClaimSettled;
use crate::state::{Claim, ClaimStatus, Member, Mutual, MUTUAL_SEED};

/// Account context for `settle_claim` — permissionless crank (EVENT-MUTUAL
/// §7). Moves no pool funds except the Failed fee refund.
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

    /// Fee float — the Failed refund source (accord's cancel_dispute put the
    /// filer fee back here; verified: cancel refunds fee_vault →
    /// filer_token_account, which is this float).
    #[account(
        mut,
        associated_token::authority = mutual,
        associated_token::mint = fee_mint,
    )]
    pub fee_float: Box<Account<'info, TokenAccount>>,

    /// The claimant's fee-mint account — refund destination.
    #[account(mut, token::mint = fee_mint, token::authority = claim.member)]
    pub claimant_ata: Box<Account<'info, TokenAccount>>,

    #[account(constraint = fee_mint.key() == mutual.fee_mint @ HanseError::WrongMint)]
    pub fee_mint: Box<Account<'info, Mint>>,

    pub token_program: Program<'info, Token>,
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
                // Liveness escape: accord already refunded the filer fee into
                // the float (cancel_dispute); forward it to the claimant,
                // signed by the mutual PDA.
                let seed_le = ctx.accounts.mutual.seed.to_le_bytes();
                token::transfer(
                    CpiContext::new_with_signer(
                        ctx.accounts.token_program.key(),
                        Transfer {
                            from: ctx.accounts.fee_float.to_account_info(),
                            to: ctx.accounts.claimant_ata.to_account_info(),
                            authority: ctx.accounts.mutual.to_account_info(),
                        },
                        &[&[MUTUAL_SEED, seed_le.as_ref(), &[ctx.accounts.mutual.bump]]],
                    ),
                    ctx.accounts.claim.fee_paid,
                )?;
                ClaimStatus::Failed
            }
            // Everything else is still live: appeals, redraws, unstarted.
            _ => return err!(HanseError::DisputeNotFinal),
        };

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
