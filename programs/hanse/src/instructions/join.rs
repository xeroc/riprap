use anchor_lang::prelude::*;
use anchor_spl::token::{Mint, Token};

use crate::error::HanseError;
use crate::events::MemberJoined;
use crate::state::{Member, Mutual, MEMBER_SEED, MEMBER_SPACE};

/// Account context for `join` — member-signed (EVENT-MUTUAL §7). The member
/// always signs (consent + the claim key); the money may come from an
/// optional sponsor (§7 sponsorship amendment, option C).
#[derive(Accounts)]
pub struct Join<'info> {
    #[account(mut)]
    pub member: Signer<'info>,

    /// Optional cover sponsor: when present, the contribution leaves this
    /// wallet's ATA (`owner_ata`) and the pool assigns the liquidation
    /// residual of the member's position to this key — the sponsor gets the
    /// leftover, the member keeps every claim right. Data-free otherwise.
    #[account(mut)]
    pub funder: Option<Signer<'info>>,

    #[account(
        init,
        payer = rent_payer,
        space = MEMBER_SPACE,
        seeds = [MEMBER_SEED, mutual.key().as_ref(), member.key().as_ref()],
        bump,
    )]
    pub member_account: Account<'info, Member>,

    pub mutual: Account<'info, Mutual>,

    /// CHECK: must be exactly `mutual.pool` — the pool this mutual owns.
    #[account(mut, constraint = pool.key() == mutual.pool @ HanseError::WrongPool)]
    pub pool: UncheckedAccount<'info>,

    /// Depositor PDA ["depositor", pool, member] — created inside the
    /// pool::deposit CPI. CHECK: seeds verified by the pool program.
    #[account(mut)]
    pub depositor: UncheckedAccount<'info>,

    /// The contribution source — the member's own deposit-mint ATA, or the
    /// sponsor's when `funder` is present. CHECK: mint and authority are
    /// enforced inside the pool::deposit CPI (pool's one mint; authority must
    /// be the owner or the passing funder).
    #[account(mut)]
    pub owner_ata: UncheckedAccount<'info>,

    /// Data-free rent payer for both init sites here: the Member PDA and
    /// the pool::deposit CPI's depositor PDA (bean riprap-gneb). v1: the
    /// member passes their own wallet; any funded wallet may sponsor the
    /// join without becoming the member.
    #[account(mut)]
    pub rent_payer: Signer<'info>,

    /// The pool treasury ATA. CHECK: created by pool::init; the pool program
    /// re-derives and checks it inside the CPI.
    #[account(mut)]
    pub treasury: UncheckedAccount<'info>,

    #[account(constraint = deposit_mint.key() == mutual.deposit_mint @ HanseError::WrongMint)]
    pub deposit_mint: Account<'info, Mint>,

    pub token_program: Program<'info, Token>,
    pub system_program: Program<'info, System>,
    /// CHECK: address-constrained to the pool program id.
    #[account(address = pool::ID)]
    pub pool_program: UncheckedAccount<'info>,
}

impl<'info> Join<'info> {
    pub fn handler_join(ctx: Context<Join<'info>>, tier: u8) -> Result<()> {
        // Gates BEFORE the CPI (§7): the covered window has not opened yet,
        // and the tier index is real. Membership itself is enforced by the
        // Member PDA `init` — one tier per member, no stacking.
        let now = Clock::get()?.unix_timestamp;
        let mutual = &ctx.accounts.mutual;
        require!(now < mutual.deposits_close_at, HanseError::DepositsClosed);
        require!(
            (tier as usize) < mutual.tiers.len(),
            HanseError::TierInvalid
        );
        let contribution = mutual.tiers[tier as usize].contribution;

        // Rights stake: rate is fixed 1:1 at initialize_mutual, so the pool
        // mints stake == contribution. The member signs as owner; the money
        // moves owner_ata (member or sponsor) → treasury inside the pool.
        pool::cpi::deposit(
            CpiContext::new(
                ctx.accounts.pool_program.key(),
                pool::cpi::accounts::Deposit {
                    pool: ctx.accounts.pool.to_account_info(),
                    depositor: ctx.accounts.depositor.to_account_info(),
                    owner: ctx.accounts.member.to_account_info(),
                    funder: ctx
                        .accounts
                        .funder
                        .as_ref()
                        .map(|f| f.to_account_info()),
                    owner_ata: ctx.accounts.owner_ata.to_account_info(),
                    rent_payer: ctx.accounts.rent_payer.to_account_info(),
                    treasury: ctx.accounts.treasury.to_account_info(),
                    token_program: ctx.accounts.token_program.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                },
            ),
            pool::Track::Rights,
            contribution,
        )?;

        {
            let m = &mut ctx.accounts.member_account;
            m.mutual = mutual.key();
            m.member = ctx.accounts.member.key();
            m.tier = tier;
            // RESERVED — stake-only until the SAS bean (riprap-7wa9).
            m.attestation = Pubkey::default();
            m.has_pending_claim = false;
            m.bump = ctx.bumps.member_account;
        }

        emit!(MemberJoined {
            mutual: mutual.key(),
            member: ctx.accounts.member.key(),
            tier,
            contribution,
        });
        Ok(())
    }
}
