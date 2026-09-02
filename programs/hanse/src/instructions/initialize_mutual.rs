use anchor_lang::prelude::*;
use anchor_spl::associated_token::AssociatedToken;
use anchor_spl::token::{Mint, Token, TokenAccount};

use crate::error::HanseError;
use crate::state::{Mutual, Phase, Tier, MUTUAL_SEED, MUTUAL_SPACE};
use crate::ID;

/// Full subaccord economics forwarded verbatim to `accord::create_subaccord`
/// (EVENT-MUTUAL §7). Fixed in code, NOT config: aggregation = Plurality
/// (binary Approve/Deny claims), shortfall = Redraw, depth = 20 (accumulator
/// default), juror_credential/juror_schema = Pubkey::default (stake-only —
/// SAS binding is bean riprap-7wa9), authority = the mutual PDA.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct SubaccordConfig {
    pub fee_per_juror: u64,
    pub min_stake: u64,
    pub alpha_bps: u16,
    pub review_window: u64,
    pub commit_window: u64,
    pub reveal_window: u64,
    /// Appeal window floor = accord's MIN_APPEAL_WINDOW_SECS (1h).
    pub appeal_window: u64,
    pub max_appeals: u8,
    /// Odd; the ladder (J+1)·2^max_appeals − 1 must fit accord's MAX_JURORS.
    pub min_jury_size: u32,
    pub reveal_threshold_bps: u16,
    pub max_draw_attempts: u8,
    /// Who receives encrypted evidence packages (§9 pipeline). v1: the
    /// initializer's operator key.
    pub evidence_operator: Pubkey,
}

/// Everything `initialize_mutual` needs (EVENT-MUTUAL §7). Timestamps are
/// unix seconds read against the Clock at execution.
#[derive(AnchorSerialize, AnchorDeserialize, Clone, Debug)]
pub struct InitializeMutualConfig {
    /// Mutual PDA seed; the pool takes the same seed.
    pub seed: u64,
    pub tiers: [Tier; 3],
    /// Cover-terms document hash — the adjudicated reference (§9).
    pub policy_hash: [u8; 32],
    pub deposits_close_at: i64,
    pub claims_close_at: i64,
    pub pull_window: i64,
    pub subaccord: SubaccordConfig,
}

/// The juror namespace of one mutual: bound to its seed AND its cover terms,
/// so a policy change is necessarily a new subaccord (and a new mutual).
pub fn subaccord_domain_ref(seed: u64, policy_hash: &[u8; 32]) -> [u8; 32] {
    ::solana_program::hash::hashv(&[b"hanse:subaccord", &seed.to_le_bytes(), policy_hash])
        .to_bytes()
}

/// The claim evidence manifest schema tag (§9): one versioned format for
/// claimant → evidence-operator → juror packages.
fn evidence_spec() -> [u8; 32] {
    ::solana_program::hash::hashv(&[b"hanse:evidence:v1"]).to_bytes()
}

/// Accumulator depth for the mutual's subaccord — accord's common default
/// (2^20 leaves ≫ pilot membership).
const SUBACCORD_DEPTH: u8 = 20;

/// Account context for `initialize_mutual` — permissionless (EVENT-MUTUAL §7).
#[derive(Accounts)]
#[instruction(config: InitializeMutualConfig)]
pub struct InitializeMutual<'info> {
    /// Initializer — recorded as the demo admin (§2.10): gates
    /// set_subaccord_param and co-signs payouts. Paying rent implies no
    /// other authority.
    #[account(mut)]
    pub authority: Signer<'info>,

    #[account(
        init,
        payer = authority,
        space = MUTUAL_SPACE,
        seeds = [MUTUAL_SEED, config.seed.to_le_bytes().as_ref()],
        bump,
    )]
    pub mutual: Account<'info, Mutual>,

    /// Pool PDA — created by the `pool::init` CPI below (rights 1:1 under
    /// the mutual_auth PDA, ownership disabled under mutual_own, yield off).
    /// CHECK: seeds-verified against the pool program; content owned by pool.
    #[account(
        mut,
        seeds = [b"pool", config.seed.to_le_bytes().as_ref()],
        bump,
        seeds::program = pool::ID,
    )]
    pub pool: UncheckedAccount<'info>,

    /// The pool's treasury ATA — created inside the `pool::init` CPI.
    /// CHECK: address asserted in the handler (anchor's ATA constraint would
    /// reject the not-yet-existing account).
    #[account(mut)]
    pub treasury: UncheckedAccount<'info>,

    /// Subaccord PDA ["subaccord", mutual, domain_ref] — created by the
    /// `accord::create_subaccord` CPI; the mutual PDA is its creator and
    /// authority. CHECK: seeds-verified against the accord program.
    /// CHECK: PDA ["subaccord", mutual, domain_ref] under the accord program,
    /// verified in the handler (idl-build cannot resolve fn calls in seeds).
    #[account(mut)]
    pub subaccord: UncheckedAccount<'info>,

    pub deposit_mint: Account<'info, Mint>,
    pub fee_mint: Account<'info, Mint>,

    /// Fee float: the mutual PDA's ATA of fee_mint — claimant-funded filing
    /// fees land here before the create_dispute CPI drains them (§2.6).
    #[account(
        init_if_needed,
        payer = authority,
        associated_token::authority = mutual,
        associated_token::mint = fee_mint,
    )]
    pub fee_float: Account<'info, TokenAccount>,

    pub token_program: Program<'info, Token>,
    pub associated_token_program: Program<'info, AssociatedToken>,
    pub system_program: Program<'info, System>,
    /// CHECK: address-constrained to the pool program id.
    #[account(address = pool::ID)]
    pub pool_program: UncheckedAccount<'info>,
    /// CHECK: address-constrained to the accord program id.
    #[account(address = accord::ID)]
    pub accord_program: UncheckedAccount<'info>,
}

impl<'info> InitializeMutual<'info> {
    pub fn handler_initialize_mutual(
        ctx: Context<InitializeMutual<'info>>,
        config: InitializeMutualConfig,
    ) -> Result<()> {
        // ── Validation, BEFORE any CPI (bean law: typed errors, never rely
        //    on the CPI failing) ──────────────────────────────────────────
        let now = Clock::get()?.unix_timestamp;
        let sub = &config.subaccord;
        require!(
            config.claims_close_at > config.deposits_close_at && config.deposits_close_at > now,
            HanseError::InvalidConfiguration
        );
        require!(config.pull_window > 0, HanseError::InvalidConfiguration);
        for t in &config.tiers {
            require!(
                t.contribution > 0 && t.max_payout >= t.contribution,
                HanseError::InvalidConfiguration
            );
        }
        // Jury shape (mirrors accord's own gate so the failure is ours):
        // odd J, and the appeal ladder (J+1)·2^appeals − 1 fits MAX_JURORS.
        require!(sub.min_jury_size % 2 == 1, HanseError::InvalidJurySize);
        let ladder_top = (sub.min_jury_size as u64)
            .checked_add(1)
            .and_then(|v| v.checked_shl(sub.max_appeals as u32))
            .and_then(|v| v.checked_sub(1))
            .ok_or(HanseError::MathOverflow)?;
        require!(
            ladder_top <= accord::MAX_JURORS as u64,
            HanseError::InvalidJurySize
        );
        // Accord domain bounds, mirrored (H-3: a pool must not be born
        // misconfigured only to be caught inside the CPI).
        require!(
            sub.max_appeals as usize <= accord::MAX_APPEALS,
            HanseError::InvalidConfiguration
        );
        require!(sub.alpha_bps <= 10_000, HanseError::InvalidConfiguration);
        require!(sub.min_stake > 0, HanseError::InvalidConfiguration);
        require!(sub.review_window > 0, HanseError::InvalidConfiguration);
        require!(sub.commit_window > 0, HanseError::InvalidConfiguration);
        require!(sub.reveal_window > 0, HanseError::InvalidConfiguration);
        require!(
            sub.appeal_window >= accord::MIN_APPEAL_WINDOW_SECS,
            HanseError::InvalidConfiguration
        );
        require!(
            sub.reveal_threshold_bps <= 10_000,
            HanseError::InvalidConfiguration
        );
        require!(
            (1..=accord::MAX_DRAW_ATTEMPTS).contains(&sub.max_draw_attempts),
            HanseError::InvalidConfiguration
        );
        require!(
            (accord::MAX_JURORS as u64)
                .checked_mul(sub.fee_per_juror)
                .is_some(),
            HanseError::MathOverflow
        );

        // ── The mutual account ───────────────────────────────────────────
        let mutual_key = ctx.accounts.mutual.key();
        let mutual_auth =
            Pubkey::find_program_address(&[b"mutual_auth", mutual_key.as_ref()], &ID).0;
        let mutual_own = Pubkey::find_program_address(&[b"mutual_own", mutual_key.as_ref()], &ID).0;

        // Treasury address sanity (the account is created by the pool CPI).
        let expected_treasury = anchor_spl::associated_token::get_associated_token_address(
            &ctx.accounts.pool.key(),
            &ctx.accounts.deposit_mint.key(),
        );
        require_keys_eq!(
            ctx.accounts.treasury.key(),
            expected_treasury,
            HanseError::InvalidConfiguration
        );

        // Subaccord PDA sanity (seeds constraint was moved here — see the
        // account's CHECK note).
        let domain_ref = subaccord_domain_ref(config.seed, &config.policy_hash);
        let (expected_subaccord, _) = Pubkey::find_program_address(
            &[
                b"subaccord",
                ctx.accounts.authority.key().as_ref(),
                domain_ref.as_ref(),
            ],
            &accord::ID,
        );
        require_keys_eq!(
            ctx.accounts.subaccord.key(),
            expected_subaccord,
            HanseError::InvalidConfiguration
        );

        {
            let m = &mut ctx.accounts.mutual;
            m.authority = ctx.accounts.authority.key();
            m.pool = ctx.accounts.pool.key();
            m.subaccord = ctx.accounts.subaccord.key();
            m.deposit_mint = ctx.accounts.deposit_mint.key();
            m.fee_mint = ctx.accounts.fee_mint.key();
            m.policy_hash = config.policy_hash;
            m.tiers = config.tiers;
            m.deposits_close_at = config.deposits_close_at;
            m.claims_close_at = config.claims_close_at;
            m.pull_window = config.pull_window;
            m.phase = Phase::Active;
            m.pull_close_at = 0;
            m.ratio_1e9 = 0;
            m.obligations = 0;
            m.fee_refunds = 0;
            m.claims_filed = 0;
            m.claims_resolved = 0;
            m.claim_nonce = 0;
            m.bump = ctx.bumps.mutual;
        }

        // ── CPI pool::init — rights 1:1 (mutual_auth), ownership disabled
        //    (mutual_own), yield off (§7) ─────────────────────────────────
        pool::cpi::init(
            CpiContext::new(
                ctx.accounts.pool_program.key(),
                pool::cpi::accounts::InitPool {
                    rent_payer: ctx.accounts.authority.to_account_info(),
                    mint: ctx.accounts.deposit_mint.to_account_info(),
                    pool: ctx.accounts.pool.to_account_info(),
                    treasury: ctx.accounts.treasury.to_account_info(),
                    token_program: ctx.accounts.token_program.to_account_info(),
                    associated_token_program: ctx
                        .accounts
                        .associated_token_program
                        .to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                },
            ),
            pool::InitParams {
                seed: config.seed,
                ownership_rate: 0,
                rights_rate: 1,
                yield_rate: 0,
                ownership_authority: mutual_own,
                rights_authority: mutual_auth,
                yield_authority: Pubkey::default(),
            },
        )?;

        // ── CPI accord::create_subaccord — creator = the initializer wallet,
        //    authority = the mutual PDA; stake-only juror binding (§2.8
        //    degradation). Synod file_dispute precedent: a data-carrying PDA
        //    cannot pay rent (system rejects transfers from data accounts)
        //    and create_subaccord has no separate rent-payer field, so the
        //    initializer wallet is the creator.
        accord::cpi::create_subaccord(
            CpiContext::new(
                ctx.accounts.accord_program.key(),
                accord::cpi::accounts::CreateSubaccord {
                    creator: ctx.accounts.authority.to_account_info(),
                    subaccord: ctx.accounts.subaccord.to_account_info(),
                    staking_token: ctx.accounts.deposit_mint.to_account_info(),
                    fee_token: ctx.accounts.fee_mint.to_account_info(),
                    system_program: ctx.accounts.system_program.to_account_info(),
                },
            ),
            domain_ref,
            evidence_spec(),
            accord::state::CreateSubaccordParams {
                min_stake: sub.min_stake,
                alpha_bps: sub.alpha_bps,
                review_window: sub.review_window,
                commit_window: sub.commit_window,
                reveal_window: sub.reveal_window,
                appeal_window: sub.appeal_window,
                max_appeals: sub.max_appeals,
                min_jury_size: sub.min_jury_size,
                aggregation: accord::state::Aggregation::Plurality,
                fee_per_juror: sub.fee_per_juror,
                reveal_threshold_bps: sub.reveal_threshold_bps,
                shortfall_policy: accord::state::ShortfallPolicy::Redraw,
                max_draw_attempts: sub.max_draw_attempts,
                coherence_tol_bps: 0,
                authority: mutual_key,
                evidence_operator: sub.evidence_operator,
                depth: SUBACCORD_DEPTH,
                juror_credential: Pubkey::default(),
                juror_schema: Pubkey::default(),
            },
        )?;

        emit!(crate::events::MutualInitialized {
            mutual: mutual_key,
            authority: ctx.accounts.authority.key(),
            pool: ctx.accounts.pool.key(),
            subaccord: ctx.accounts.subaccord.key(),
        });
        Ok(())
    }
}
