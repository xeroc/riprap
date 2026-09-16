use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{self, Mint, Token, TokenAccount, Transfer};

use crate::error::HanseError;
use crate::events::ClaimFiled;
use crate::state::{Claim, ClaimStatus, Member, Mutual, CLAIM_SEED, CLAIM_SPACE, MUTUAL_SEED};

/// Option label for one ruling index — the TS e2e MUST reproduce this exact
/// recipe to map Dispute.final_ruling back to a verdict:
/// `H("hanse-opt" ‖ mutual ‖ index_le_u64)`, Approve = 0, Deny = 1
/// (synod option_label pattern).
pub fn option_label(mutual: &Pubkey, index: u64) -> [u8; 32] {
    ::solana_program::hash::hashv(&[b"hanse-opt", mutual.as_ref(), &index.to_le_bytes()]).to_bytes()
}

/// Filing evidence manifest hash (§9): the claimant's evidence commitment
/// plus the public structural context jurors rule under —
/// `H(evidence_hash ‖ tier_le ‖ contribution_le ‖ treasury_balance_le)`.
pub fn evidence_manifest(
    evidence_hash: &[u8; 32],
    tier: u8,
    contribution: u64,
    treasury_balance: u64,
) -> [u8; 32] {
    ::solana_program::hash::hashv(&[
        evidence_hash,
        &[tier],
        &contribution.to_le_bytes(),
        &treasury_balance.to_le_bytes(),
    ])
    .to_bytes()
}

/// Account context for `file_claim` — member-signed (EVENT-MUTUAL §7).
#[derive(Accounts)]
#[instruction(requested: u64, evidence_hash: [u8; 32], nonce: u64)]
pub struct FileClaim<'info> {
    #[account(mut)]
    pub claimant: Signer<'info>,

    /// Data-free rent payer for the Claim PDA init — decoupled from the
    /// claimant so a third party can sponsor the filing (the juror fee
    /// still leaves the claimant's own fee ATA, §2.6).
    #[account(mut)]
    pub rent_payer: Signer<'info>,

    #[account(
        mut,
        constraint = mutual.phase == crate::state::Phase::Active @ HanseError::MutualNotActive
    )]
    pub mutual: Box<Account<'info, Mutual>>,

    /// One Pending claim per member — the flip lives in the handler.
    #[account(
        mut,
        seeds = [crate::state::MEMBER_SEED, mutual.key().as_ref(), claimant.key().as_ref()],
        bump,
        constraint = member_account.mutual == mutual.key() @ HanseError::NotMember,
        constraint = member_account.member == claimant.key() @ HanseError::NotMember,
        constraint = !member_account.has_pending_claim @ HanseError::PendingClaimExists,
    )]
    pub member_account: Box<Account<'info, Member>>,

    #[account(
        init,
        payer = rent_payer,
        space = CLAIM_SPACE,
        seeds = [CLAIM_SEED, mutual.key().as_ref(), nonce.to_le_bytes().as_ref()],
        bump,
    )]
    pub claim: Box<Account<'info, Claim>>,

    /// The member's pool position. CHECK: PDA ["depositor", pool, member]
    /// under the pool program, verified in the handler; ownership by the pool
    /// program is enforced by the Account type.
    pub depositor: Box<Account<'info, pool::Depositor>>,

    /// The subaccord this mutual owns — the live source of the filing fee.
    /// mut: accord's create_dispute writes fee tracking on it.
    #[account(
        mut,
        constraint = subaccord.key() == mutual.subaccord @ HanseError::WrongSubaccord
    )]
    pub subaccord: Box<Account<'info, accord::state::Subaccord>>,

    /// The member's fee-mint ATA — the upfront juror fee leaves here.
    #[account(
        mut,
        token::mint = fee_mint,
        token::authority = claimant,
    )]
    pub member_fee_ata: Box<Account<'info, TokenAccount>>,

    /// Fee float: the mutual PDA's ATA of fee_mint — the fee lands here, the
    /// create_dispute CPI drains it into the subaccord fee vault.
    #[account(
        mut,
        associated_token::authority = mutual,
        associated_token::mint = fee_mint,
    )]
    pub fee_float: Box<Account<'info, TokenAccount>>,

    #[account(constraint = fee_mint.key() == mutual.fee_mint @ HanseError::WrongMint)]
    pub fee_mint: Account<'info, Mint>,

    /// Pool treasury — read for the solvency context baked into the evidence
    /// manifest. CHECK: must be the pool's ATA; verified in the handler.
    pub treasury: Box<Account<'info, TokenAccount>>,

    /// The Dispute PDA ["dispute", mutual, nonce] — created by the CPI.
    /// CHECK: verified in the handler before the CPI.
    #[account(mut)]
    pub dispute: UncheckedAccount<'info>,

    /// The subaccord's fee vault ATA — created (init_if_needed) by the CPI.
    /// CHECK: re-derived and enforced inside the accord CPI.
    #[account(mut)]
    pub fee_vault: UncheckedAccount<'info>,

    /// Accord's global state (pause flag).
    pub accord_state: Box<Account<'info, accord::state::AccordState>>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    /// CHECK: address-constrained to the accord program id.
    #[account(address = accord::ID)]
    pub accord_program: UncheckedAccount<'info>,
}

impl<'info> FileClaim<'info> {
    pub fn handler_file_claim(
        ctx: Context<FileClaim<'info>>,
        requested: u64,
        evidence_hash: [u8; 32],
        nonce: u64,
    ) -> Result<()> {
        // ── Gates (§7), all before the money moves ────────────────────────
        let now = Clock::get()?.unix_timestamp;
        let mutual = &ctx.accounts.mutual;
        require!(now < mutual.claims_close_at, HanseError::ClaimsClosed);
        // The Claim PDA seed is the mutual's OWN claim_nonce — the arg exists
        // only so the constraint can see it.
        require!(nonce == mutual.claim_nonce, HanseError::NonceMismatch);
        require!(requested > 0, HanseError::InvalidClaimAmount);

        let member = &ctx.accounts.member_account;
        require!(
            (member.tier as usize) < mutual.tiers.len(),
            HanseError::TierInvalid
        );
        // The tier the member bought — enforced clamp, not adjudicated (§2.3).
        let tier = mutual.tiers[member.tier as usize];
        let claim_amount = requested.min(tier.max_payout);

        // Burned-out members have no cover: rights stake must be positive.
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
        require!(
            ctx.accounts.depositor.rights_stake > 0,
            HanseError::NoRightsStake
        );

        // Treasury must be the pool's canonical ATA (its balance is baked
        // into the evidence manifest).
        let expected_treasury = anchor_spl::associated_token::get_associated_token_address(
            &mutual.pool,
            &mutual.deposit_mint,
        );
        require_keys_eq!(
            ctx.accounts.treasury.key(),
            expected_treasury,
            HanseError::WrongTreasury
        );

        // Dispute PDA bound to this mutual + this nonce (filer = mutual PDA).
        let (expected_dispute, _) = Pubkey::find_program_address(
            &[
                b"dispute",
                mutual.key().as_ref(),
                nonce.to_le_bytes().as_ref(),
            ],
            &accord::ID,
        );
        require_keys_eq!(
            ctx.accounts.dispute.key(),
            expected_dispute,
            HanseError::WrongDispute
        );

        // ── Fee: min_jury_size × fee_per_juror, claimant-funded (§2.6) ────
        let jury_fee = u64::from(ctx.accounts.subaccord.min_jury_size);
        let fee = jury_fee
            .checked_mul(ctx.accounts.subaccord.fee_per_juror)
            .ok_or(HanseError::MathOverflow)?;
        token::transfer(
            CpiContext::new(
                ctx.accounts.token_program.key(),
                Transfer {
                    from: ctx.accounts.member_fee_ata.to_account_info(),
                    to: ctx.accounts.fee_float.to_account_info(),
                    authority: ctx.accounts.claimant.to_account_info(),
                },
            ),
            fee,
        )?;

        // ── CPI accord::create_dispute — mutual PDA files; claimant pays
        //    rent (ADR-0028, data-free signer); float pays the fee ────────
        let options = vec![
            option_label(&mutual.key(), 0), // Approve
            option_label(&mutual.key(), 1), // Deny
        ];
        let manifest = evidence_manifest(
            &evidence_hash,
            member.tier,
            tier.contribution,
            ctx.accounts.treasury.amount,
        );
        let seed_le = mutual.seed.to_le_bytes();
        accord::cpi::create_dispute(
            CpiContext::new_with_signer(
                ctx.accounts.accord_program.key(),
                accord::cpi::accounts::CreateDispute {
                    filer: ctx.accounts.mutual.to_account_info(),
                    rent_payer: ctx.accounts.claimant.to_account_info(),
                    subaccord: ctx.accounts.subaccord.to_account_info(),
                    accord_state: ctx.accounts.accord_state.to_account_info(),
                    dispute: ctx.accounts.dispute.to_account_info(),
                    fee_token: ctx.accounts.fee_mint.to_account_info(),
                    filer_token_account: ctx.accounts.fee_float.to_account_info(),
                    fee_vault: ctx.accounts.fee_vault.to_account_info(),
                    token_program: ctx.accounts.token_program.to_account_info(),
                    associated_token_program: ctx
                        .accounts
                        .associated_token_program
                        .to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                },
                &[&[MUTUAL_SEED, seed_le.as_ref(), &[mutual.bump]]],
            ),
            options,
            manifest,
            nonce,
            fee,
        )?;

        // ── Bookkeeping ───────────────────────────────────────────────────
        {
            let c = &mut ctx.accounts.claim;
            c.mutual = mutual.key();
            c.member = ctx.accounts.claimant.key();
            c.claim_amount = claim_amount;
            c.dispute = expected_dispute;
            c.fee_paid = fee;
            c.status = ClaimStatus::Pending;
            c.filed_at = now;
            c.settled_at = 0;
            c.bump = ctx.bumps.claim;
        }
        let mutual = &mut ctx.accounts.mutual;
        mutual.claims_filed += 1;
        mutual.claim_nonce += 1;
        ctx.accounts.member_account.has_pending_claim = true;

        emit!(ClaimFiled {
            mutual: ctx.accounts.mutual.key(),
            claim: ctx.accounts.claim.key(),
            member: ctx.accounts.claimant.key(),
            claim_amount,
            fee_paid: fee,
            dispute: expected_dispute,
        });
        Ok(())
    }
}

#[cfg(test)]
mod tests {
    use super::*;

    /// Option labels are deterministic, distinct, and the index mapping is
    /// the TS e2e contract: Approve = 0, Deny = 1 (bean riprap-ihyo).
    #[test]
    fn option_labels_deterministic_and_distinct() {
        let mutual = Pubkey::new_from_array([0x5E; 32]);
        let approve = option_label(&mutual, 0);
        let deny = option_label(&mutual, 1);
        assert_eq!(approve, option_label(&mutual, 0));
        assert_ne!(approve, deny);
    }

    /// Evidence manifest binds evidence + tier + contribution + treasury
    /// balance (§9 structural context).
    #[test]
    fn evidence_manifest_is_sensitivity_bound() {
        let h = [1u8; 32];
        let a = evidence_manifest(&h, 1, 20_000_000, 1_000_000);
        assert_eq!(a, evidence_manifest(&h, 1, 20_000_000, 1_000_000));
        assert_ne!(a, evidence_manifest(&h, 1, 20_000_000, 2_000_000));
        assert_ne!(a, evidence_manifest(&h, 2, 20_000_000, 1_000_000));
        assert_ne!(a, evidence_manifest(&h, 1, 40_000_000, 1_000_000));
    }
}
