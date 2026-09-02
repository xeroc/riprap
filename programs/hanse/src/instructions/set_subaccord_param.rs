use anchor_lang::prelude::*;

use crate::error::HanseError;
use crate::events::SubaccordParamSet;
use crate::state::{Mutual, MUTUAL_SEED};

/// The v1 admin levers — a typed passthrough of the accord `UpdatePayload`
/// variants this mutual exposes (§7 set_subaccord_param; MAJORITY-EXPLOIT §6:
/// `MinStake` is the mid-event incident-response lever). Deliberately NOT
/// exposed: `Authority` (handing the subaccord away is not a demo knob),
/// `EvidenceOperator` (evidence pipeline key, §9), and the draw machinery
/// (`MaxAppeals`, `RevealThresholdBps`, `MaxDrawAttempts`) — the mutual never
/// tunes sortition in v1.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Copy, PartialEq, Eq, Debug)]
pub enum SubaccordParam {
    MinStake(u64),
    FeePerJuror(u64),
    AlphaBps(u16),
    ReviewWindow(u64),
    CommitWindow(u64),
    RevealWindow(u64),
    AppealWindow(u64),
}

impl From<SubaccordParam> for accord::state::UpdatePayload {
    fn from(p: SubaccordParam) -> Self {
        use accord::state::UpdatePayload as U;
        match p {
            SubaccordParam::MinStake(v) => U::MinStake(v),
            SubaccordParam::FeePerJuror(v) => U::FeePerJuror(v),
            SubaccordParam::AlphaBps(v) => U::AlphaBps(v),
            SubaccordParam::ReviewWindow(v) => U::ReviewWindow(v),
            SubaccordParam::CommitWindow(v) => U::CommitWindow(v),
            SubaccordParam::RevealWindow(v) => U::RevealWindow(v),
            SubaccordParam::AppealWindow(v) => U::AppealWindow(v),
        }
    }
}

/// Account context for `set_subaccord_param` — demo admin lever (§2.10/§7).
/// The 48h timelock is accord-side; execution there is permissionless.
#[derive(Accounts)]
#[instruction(nonce: u64)]
pub struct SetSubaccordParam<'info> {
    /// Must be the mutual's initializer (demo admin).
    #[account(mut)]
    pub authority: Signer<'info>,

    /// Data-free rent payer for the PendingUpdate init (ADR-0028) — v1: the
    /// admin pays their own rent.
    #[account(mut)]
    pub rent_payer: Signer<'info>,

    pub mutual: Box<Account<'info, Mutual>>,

    #[account(constraint = subaccord.key() == mutual.subaccord @ HanseError::WrongSubaccord)]
    pub subaccord: Box<Account<'info, accord::state::Subaccord>>,

    /// PendingUpdate PDA ["update", subaccord, nonce] — created by the CPI.
    /// CHECK: verified in the handler (fn-call seeds don't compile under
    /// idl-build; the CPI re-checks anyway).
    #[account(mut)]
    pub pending_update: UncheckedAccount<'info>,

    pub system_program: Program<'info, System>,
    /// CHECK: address-constrained to the accord program id.
    #[account(address = accord::ID)]
    pub accord_program: UncheckedAccount<'info>,
}

impl<'info> SetSubaccordParam<'info> {
    pub fn handler_set_subaccord_param(
        ctx: Context<SetSubaccordParam<'info>>,
        nonce: u64,
        param: SubaccordParam,
    ) -> Result<()> {
        let mutual = &ctx.accounts.mutual;
        require_keys_eq!(
            ctx.accounts.authority.key(),
            mutual.authority,
            HanseError::Unauthorized
        );

        let (expected_pending, _) = Pubkey::find_program_address(
            &[
                b"update",
                ctx.accounts.subaccord.key().as_ref(),
                nonce.to_le_bytes().as_ref(),
            ],
            &accord::ID,
        );
        require_keys_eq!(
            ctx.accounts.pending_update.key(),
            expected_pending,
            HanseError::WrongPendingUpdate
        );

        // The mutual PDA is the subaccord's authority; it signs the proposal.
        let seed_le = mutual.seed.to_le_bytes();
        let payload: accord::state::UpdatePayload = param.into();
        accord::cpi::propose_subaccord_update(
            CpiContext::new_with_signer(
                ctx.accounts.accord_program.key(),
                accord::cpi::accounts::ProposeSubaccordUpdate {
                    authority: ctx.accounts.mutual.to_account_info(),
                    rent_payer: ctx.accounts.rent_payer.to_account_info(),
                    subaccord: ctx.accounts.subaccord.to_account_info(),
                    pending_update: ctx.accounts.pending_update.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                },
                &[&[MUTUAL_SEED, seed_le.as_ref(), &[mutual.bump]]],
            ),
            nonce,
            payload.clone(),
        )?;

        emit!(SubaccordParamSet {
            mutual: mutual.key(),
            subaccord: ctx.accounts.subaccord.key(),
            nonce,
            payload,
        });
        Ok(())
    }
}
