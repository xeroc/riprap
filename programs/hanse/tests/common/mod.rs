//! Shared LiteSVM harness for the hanse suites — pool's `lifecycle.rs` Env
//! pattern, extended to three programs (hanse + pool + accord).
//!
//! Contract: `anchor build` must have produced `target/deploy/*.so` before
//! `cargo test` runs (the `pnpm verify` gate guarantees the order). The
//! accord binary is NOT in this repo — it is read at runtime from the
//! sibling checkout (or `$ACCORD_SO`), see [`accord_bytes`].

// PDA/fabrication helpers exist for the instruction suites (sibling beans);
// not every helper is used by the smoke tests yet.
#![allow(dead_code)]

use {
    anchor_lang::{
        solana_program::{instruction::Instruction, pubkey::Pubkey, system_program},
        AccountDeserialize,
    },
    litesvm::LiteSVM,
    solana_account::Account,
    solana_keypair::Keypair,
    solana_message::{Message, VersionedMessage},
    solana_program_pack::Pack,
    solana_signer::Signer,
    solana_transaction::versioned::VersionedTransaction,
    spl_associated_token_account_interface::address::get_associated_token_address,
    spl_token_interface::instruction as token_ix,
};

const POOL_WASM: &[u8] = include_bytes!("../../../../target/deploy/pool.so");
const HANSE_WASM: &[u8] = include_bytes!("../../../../target/deploy/hanse.so");

/// Why the harness could not boot: the accord binary lives in the sibling
/// repo (`Accord/accord`), which is not part of this workspace.
#[derive(Debug)]
pub enum AccordBinaryError {
    /// No file at the resolved path — clone the sibling checkout next to this
    /// repo, `anchor build` it, or point `ACCORD_SO` at an existing binary.
    Missing {
        path: std::path::PathBuf,
    },
    Io(std::io::Error),
}

impl std::fmt::Display for AccordBinaryError {
    fn fmt(&self, f: &mut std::fmt::Formatter<'_>) -> std::fmt::Result {
        match self {
            AccordBinaryError::Missing { path } => write!(
                f,
                "accord.so not found at {} — it is not part of this repo. \
                 Clone github.com/xeroc/accord as a sibling checkout, run \
                 `anchor build` there, or set ACCORD_SO to the binary's path.",
                path.display()
            ),
            AccordBinaryError::Io(e) => write!(f, "reading accord.so: {e}"),
        }
    }
}

impl From<std::io::Error> for AccordBinaryError {
    fn from(e: std::io::Error) -> Self {
        if e.kind() == std::io::ErrorKind::NotFound {
            AccordBinaryError::Missing {
                path: accord_so_path(),
            }
        } else {
            AccordBinaryError::Io(e)
        }
    }
}

fn accord_so_path() -> std::path::PathBuf {
    std::env::var_os("ACCORD_SO")
        .map(std::path::PathBuf::from)
        .unwrap_or_else(|| {
            // CARGO_MANIFEST_DIR = programs/hanse → sibling checkout next to
            // this repo.
            std::path::Path::new(env!("CARGO_MANIFEST_DIR"))
                .join("../../../accord/target/deploy/accord.so")
        })
}

/// The accord program bytes, read at runtime from the sibling checkout
/// (overridable via `ACCORD_SO`).
pub fn accord_bytes() -> Result<Vec<u8>, AccordBinaryError> {
    std::fs::read(accord_so_path()).map_err(Into::into)
}

/// The shared test world: three programs, a funded payer, a 6-decimal
/// USDC-style mint. Mutual/pool accounts are created by the programs'
/// instructions (initialize_mutual), not here.
pub struct Env {
    pub svm: LiteSVM,
    pub payer: Keypair,
    pub mint: Pubkey,
}

impl Env {
    pub fn setup() -> Result<Self, AccordBinaryError> {
        let payer = Keypair::new();
        let mint_kp = Keypair::new();

        let mut svm = LiteSVM::new();
        svm.add_program(pool::id(), POOL_WASM).unwrap();
        svm.add_program(hanse::id(), HANSE_WASM).unwrap();
        svm.add_program(accord::id(), &accord_bytes()?).unwrap();
        svm.airdrop(&payer.pubkey(), 50_000_000_000).unwrap();

        // A real SPL mint, 6 decimals (USDC-style).
        send(
            &mut svm,
            &[
                create_account(
                    &payer,
                    &mint_kp,
                    10_000_000_000,
                    82,
                    &spl_token_interface::ID,
                ),
                token_ix::initialize_mint2(
                    &spl_token_interface::ID,
                    &mint_kp.pubkey(),
                    &payer.pubkey(),
                    None,
                    6,
                )
                .unwrap(),
            ],
            &mut [&payer, &mint_kp],
        );

        Ok(Self {
            svm,
            payer,
            mint: mint_kp.pubkey(),
        })
    }
}

// ── transactions and tokens (pool lifecycle.rs pattern) ────────────────────

pub fn send(svm: &mut LiteSVM, ixs: &[Instruction], signers: &mut [&Keypair]) {
    try_send(svm, ixs, signers).unwrap();
}

pub fn try_send(
    svm: &mut LiteSVM,
    ixs: &[Instruction],
    signers: &mut [&Keypair],
) -> Result<(), String> {
    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(ixs, Some(&signers[0].pubkey()), &blockhash);
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), signers).unwrap();
    svm.send_transaction(tx)
        .map(|_| ())
        .map_err(|e| format!("{e:?}"))
}

/// SystemInstruction::CreateAccount: u32(0) + u64 lamports + u64 space + owner.
pub fn create_account(
    payer: &Keypair,
    to: &Keypair,
    lamports: u64,
    space: u64,
    owner: &Pubkey,
) -> Instruction {
    let mut data = Vec::with_capacity(52);
    data.extend_from_slice(&0u32.to_le_bytes());
    data.extend_from_slice(&lamports.to_le_bytes());
    data.extend_from_slice(&space.to_le_bytes());
    data.extend_from_slice(owner.as_ref());
    Instruction::new_with_bytes(
        system_program::ID,
        &data,
        vec![
            anchor_lang::solana_program::instruction::AccountMeta::new(payer.pubkey(), true),
            anchor_lang::solana_program::instruction::AccountMeta::new(to.pubkey(), true),
        ],
    )
}

pub fn token_amount(svm: &LiteSVM, ata: &Pubkey) -> u64 {
    use spl_token_interface::state::Account as TokenAccount;
    let acct = svm.get_account(ata).unwrap();
    TokenAccount::unpack(&acct.data).unwrap().amount
}

pub fn ata(owner: &Pubkey, mint: &Pubkey) -> Pubkey {
    get_associated_token_address(owner, mint)
}

// ── clock ──────────────────────────────────────────────────────────────────

/// Warp the Clock sysvar's unix timestamp — the deposits/claims deadlines and
/// pull windows read this.
pub fn warp_clock(svm: &mut LiteSVM, unix_timestamp: i64) {
    let mut clock = svm.get_sysvar::<solana_clock::Clock>();
    clock.unix_timestamp = unix_timestamp;
    svm.set_sysvar::<solana_clock::Clock>(&clock);
}

// ── PDAs ───────────────────────────────────────────────────────────────────

pub fn mutual_pda(seed: u64) -> Pubkey {
    Pubkey::find_program_address(
        &[hanse::MUTUAL_SEED, seed.to_le_bytes().as_ref()],
        &hanse::id(),
    )
    .0
}

pub fn member_pda(mutual: &Pubkey, member: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(
        &[hanse::MEMBER_SEED, mutual.as_ref(), member.as_ref()],
        &hanse::id(),
    )
    .0
}

pub fn claim_pda(mutual: &Pubkey, nonce: u64) -> Pubkey {
    Pubkey::find_program_address(
        &[
            hanse::CLAIM_SEED,
            mutual.as_ref(),
            nonce.to_le_bytes().as_ref(),
        ],
        &hanse::id(),
    )
    .0
}

/// The mutual's rights authority over its pool — pool spends adjudicated
/// payouts from here.
pub fn mutual_auth_pda(mutual: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(&[b"mutual_auth", mutual.as_ref()], &hanse::id()).0
}

/// The mutual's ownership authority over its pool — dissolve liquidates
/// from here.
pub fn mutual_own_pda(mutual: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(&[b"mutual_own", mutual.as_ref()], &hanse::id()).0
}

pub fn pool_pda(seed: u64) -> Pubkey {
    Pubkey::find_program_address(&[b"pool", seed.to_le_bytes().as_ref()], &pool::id()).0
}

pub fn pool_treasury(pool: &Pubkey, mint: &Pubkey) -> Pubkey {
    get_associated_token_address(pool, mint)
}

pub fn pool_depositor(pool: &Pubkey, owner: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(&[b"depositor", pool.as_ref(), owner.as_ref()], &pool::id()).0
}

pub fn dispute_pda(filer: &Pubkey, nonce: u64) -> Pubkey {
    accord::pda::dispute_pda(filer, nonce).0
}

// ── dispute fabrication (settle_claim tests) ───────────────────────────────
//
// LiteSVM cannot run the voting flows (those live in the TS e2e), so terminal
// Dispute states are written directly — the accord accumulator_litesvm
// inject_vrf_freeze precedent: deserialize, mutate, re-serialize behind the
// unchanged 8-byte discriminator, set_account.

/// Plant a whole Dispute account (test-only, before file_claim exists on
/// chain): zeros + Plurality terms, owned by the accord program.
pub fn plant_dispute(svm: &mut LiteSVM, address: &Pubkey, dispute: &accord::state::Dispute) {
    let mut data = Vec::new();
    anchor_lang::AccountSerialize::try_serialize(dispute, &mut data).unwrap();
    write_account(svm, address, data);
}

/// Force an existing (filed) dispute to Final with the given winning option
/// index — 0 = Approve, 1 = Deny for a mutual-filed binary dispute.
pub fn force_final(svm: &mut LiteSVM, address: &Pubkey, winning_option: u64) {
    let (mut dispute, lamports) = read_dispute(svm, address);
    dispute.state = accord::state::DisputeState::Final;
    dispute.final_ruling = winning_option;
    dispute.finalized_at = 1_700_000_000;
    let mut data = svm.get_account(address).unwrap().data[..8].to_vec();
    ::borsh::BorshSerialize::serialize(&dispute, &mut data).unwrap();
    let _ = lamports;
    write_account(svm, address, data);
}

/// Force an existing (filed) dispute to Failed — the liveness escape; the
/// filer fee refunds to the claimant.
pub fn force_failed(svm: &mut LiteSVM, address: &Pubkey) {
    let (mut dispute, _) = read_dispute(svm, address);
    dispute.state = accord::state::DisputeState::Failed;
    let mut data = svm.get_account(address).unwrap().data[..8].to_vec();
    ::borsh::BorshSerialize::serialize(&dispute, &mut data).unwrap();
    write_account(svm, address, data);
}

pub fn read_dispute(svm: &LiteSVM, address: &Pubkey) -> (accord::state::Dispute, u64) {
    let acc = svm.get_account(address).expect("dispute exists");
    let dispute = accord::state::Dispute::try_deserialize(&mut &acc.data[..]).unwrap();
    (dispute, acc.lamports)
}

fn write_account(svm: &mut LiteSVM, address: &Pubkey, data: Vec<u8>) {
    let existing = svm.get_account(address);
    svm.set_account(
        *address,
        Account {
            lamports: existing.map(|a| a.lamports).unwrap_or(1_000_000_000),
            data,
            owner: accord::id(),
            executable: false,
            rent_epoch: 0,
        },
    )
    .unwrap();
}

/// A minimal all-zero Plurality Dispute for planting (smoke tests and any
/// case that needs a dispute without a real filing).
pub fn base_dispute(filer: Pubkey, nonce: u64) -> accord::state::Dispute {
    use accord::state::*;
    Dispute {
        subaccord: Pubkey::default(),
        filer,
        nonce,
        num_options: 2,
        options: [[0u8; 32]; accord::MAX_OPTIONS],
        evidence_hashes: [[0u8; 32]; accord::NUM_EVIDENCE_SLOTS],
        state: DisputeState::Created,
        current_round: 0,
        terms: CaseTerms {
            alpha_bps: 0,
            min_stake: 0,
            fee_per_juror: 0,
            review_window: 0,
            commit_window: 0,
            reveal_window: 0,
            appeal_window: 0,
            max_appeals: 0,
            min_jury_size: 3,
            aggregation: Aggregation::Plurality,
            reveal_threshold_bps: 0,
            shortfall_policy: ShortfallPolicy::Redraw,
            max_draw_attempts: 0,
            coherence_tol_bps: 0,
        },
        final_ruling: u64::MAX,
        finalized_at: 0,
        fee_paid: 0,
        committed_vrf: None,
        frozen_root: [0u8; 32],
        frozen_total_stake: 0,
        filed_at: 0,
        bump: 255,
        drawn_seats: 0,
        padding: [0u8; 60],
    }
}

// ── error assertions (pool lifecycle.rs pattern) ───────────────────────────

/// Custom code = `HanseError variant as u32 + 6000` (ERROR_CODE_OFFSET);
/// match the code inside the Debug output.
pub fn assert_custom_err(res: Result<(), String>, expected: hanse::HanseError) {
    let err = res.unwrap_err();
    let code = expected as u32 + 6000;
    assert!(
        err.contains(&format!("Custom({code})")),
        "expected {expected:?} (code {code}), got: {err}"
    );
}

// ── shared initialize_mutual wiring (used by every instruction suite) ───────

pub const INIT_TEST_NOW: i64 = 1_700_000_000;

pub fn default_config(seed: u64) -> hanse::instructions::InitializeMutualConfig {
    use hanse::instructions::*;
    InitializeMutualConfig {
        seed,
        tiers: [
            hanse::Tier {
                contribution: 10_000_000,
                max_payout: 1_000_000_000,
            },
            hanse::Tier {
                contribution: 20_000_000,
                max_payout: 2_000_000_000,
            },
            hanse::Tier {
                contribution: 40_000_000,
                max_payout: 4_000_000_000,
            },
        ],
        policy_hash: [7u8; 32],
        deposits_close_at: INIT_TEST_NOW + 86_400,
        claims_close_at: INIT_TEST_NOW + 2 * 86_400,
        pull_window: 7 * 86_400,
        subaccord: SubaccordConfig {
            fee_per_juror: 1_000_000,
            min_stake: 10_000_000,
            alpha_bps: 5_000,
            review_window: 3_600,
            commit_window: 3_600,
            reveal_window: 3_600,
            appeal_window: 3_600,
            max_appeals: 1,
            min_jury_size: 3,
            reveal_threshold_bps: 6_666,
            max_draw_attempts: 3,
            evidence_operator: Pubkey::new_unique(),
        },
    }
}

pub fn init_mutual(
    env: &mut Env,
    cfg: &hanse::instructions::InitializeMutualConfig,
) -> Result<(), String> {
    use anchor_lang::solana_program::instruction::Instruction;
    use anchor_lang::{InstructionData, ToAccountMetas};
    let mutual = mutual_pda(cfg.seed);
    let pool = pool_pda(cfg.seed);
    let domain_ref = hanse::instructions::subaccord_domain_ref(cfg.seed, &cfg.policy_hash);
    let subaccord = Pubkey::find_program_address(
        &[
            b"subaccord",
            env.payer.pubkey().as_ref(),
            domain_ref.as_ref(),
        ],
        &accord::id(),
    )
    .0;
    let ix = Instruction::new_with_bytes(
        hanse::id(),
        &hanse::instruction::InitializeMutual {
            config: cfg.clone(),
        }
        .data(),
        hanse::accounts::InitializeMutual {
            authority: env.payer.pubkey(),
            mutual,
            pool,
            treasury: pool_treasury(&pool, &env.mint),
            subaccord,
            deposit_mint: env.mint,
            fee_mint: env.mint,
            fee_float: ata(&mutual, &env.mint),
            token_program: spl_token_interface::ID,
            associated_token_program: spl_associated_token_account_interface::program::ID,
            system_program: anchor_lang::solana_program::system_program::ID,
            pool_program: pool::id(),
            accord_program: accord::id(),
        }
        .to_account_metas(None),
    );
    try_send(&mut env.svm, &[ix], &mut [&env.payer])
}

/// Boot the env, pin the clock at INIT_TEST_NOW, and initialize mutual #seed.
pub fn setup_with_mutual(seed: u64) -> (Env, hanse::instructions::InitializeMutualConfig) {
    let mut env = Env::setup().unwrap();
    warp_clock(&mut env.svm, INIT_TEST_NOW);
    let cfg = default_config(seed);
    init_mutual(&mut env, &cfg).unwrap();
    (env, cfg)
}
