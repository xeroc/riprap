//! initialize_mutual tests (EVENT-MUTUAL §7, bean riprap-dh7g): permissionless
//! init wiring pool + subaccord + fee float, with all config validation
//! failing BEFORE any CPI.

mod common;

use {
    anchor_lang::{solana_program::pubkey::Pubkey, InstructionData, ToAccountMetas},
    common::*,
    solana_signer::Signer,
};

use common::INIT_TEST_NOW as NOW;

fn config(seed: u64) -> hanse::instructions::InitializeMutualConfig {
    default_config(seed)
}

fn init_tx(env: &mut Env, cfg: &hanse::instructions::InitializeMutualConfig) -> Result<(), String> {
    use anchor_lang::solana_program::instruction::Instruction;
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

fn setup() -> Env {
    let mut env = Env::setup().unwrap();
    warp_clock(&mut env.svm, NOW);
    env
}

/// §7 happy path: one instruction wires mutual + pool + subaccord + fee
/// float exactly as specced.
#[test]
fn initialize_mutual_wires_pool_subaccord_and_float() {
    let mut env = setup();
    let cfg = config(1);
    init_tx(&mut env, &cfg).unwrap();

    let mutual = mutual_pda(1);
    let m: hanse::Mutual = anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env.svm.get_account(&mutual).unwrap().data[..],
    )
    .unwrap();
    assert_eq!(
        m.authority,
        env.payer.pubkey(),
        "initializer is the demo admin"
    );
    assert_eq!(m.deposit_mint, env.mint);
    assert_eq!(m.fee_mint, env.mint);
    assert_eq!(m.policy_hash, [7u8; 32]);
    assert_eq!(m.tiers, cfg.tiers);
    assert_eq!(m.deposits_close_at, cfg.deposits_close_at);
    assert_eq!(m.claims_close_at, cfg.claims_close_at);
    assert_eq!(m.pull_window, cfg.pull_window);
    assert_eq!(m.phase, hanse::state::Phase::Active);
    assert_eq!(
        (m.claims_filed, m.claims_resolved, m.claim_nonce),
        (0, 0, 0)
    );

    // Pool: rights 1:1 under mutual_auth, ownership disabled under mutual_own.
    let pool_key = pool_pda(1);
    let p: pool::Pool = anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env.svm.get_account(&pool_key).unwrap().data[..],
    )
    .unwrap();
    assert_eq!(p.mint, env.mint);
    assert_eq!(p.rights_rate, 1);
    assert_eq!(
        p.ownership_rate, 0,
        "ownership disabled (spec: residual via dissolve)"
    );
    assert_eq!(p.yield_rate, 0);
    assert_eq!(p.rights_authority, mutual_auth_pda(&mutual));
    assert_eq!(p.ownership_authority, mutual_own_pda(&mutual));

    // Subaccord: created by the mutual PDA, which holds authority.
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
    let s: accord::state::Subaccord = anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env.svm.get_account(&subaccord).unwrap().data[..],
    )
    .unwrap();
    assert_eq!(
        s.creator,
        env.payer.pubkey(),
        "initializer pays subaccord rent (synod precedent)"
    );
    assert_eq!(s.authority, mutual, "the mutual PDA holds the powers");
    assert_eq!(s.fee_per_juror, cfg.subaccord.fee_per_juror);
    assert_eq!(s.fee_token, env.mint);
    assert_eq!(s.aggregation, accord::state::Aggregation::Plurality);
    assert_eq!(s.min_jury_size, cfg.subaccord.min_jury_size);
    assert_eq!(
        s.juror_credential,
        Pubkey::default(),
        "stake-only (riprap-7wa9)"
    );
    assert_eq!(s.juror_schema, Pubkey::default());
    assert_eq!(m.subaccord, subaccord);

    // Fee float: the mutual PDA's ATA of fee_mint, empty.
    let float = ata(&mutual, &env.mint);
    assert_eq!(token_amount(&env.svm, &float), 0);
    assert_eq!(
        env.svm.get_account(&float).unwrap().owner,
        spl_token_interface::ID
    );
}

/// The mutual PDA is init'd — a second init reverts.
#[test]
fn reinit_reverts() {
    let mut env = setup();
    init_tx(&mut env, &config(2)).unwrap();
    let err = init_tx(&mut env, &config(2)).unwrap_err();
    assert!(err.contains("already in use"), "anchor init guard: {err}");
}

#[test]
fn bad_timestamps_revert() {
    let mut env = setup();
    let mut cfg = config(3);
    cfg.claims_close_at = cfg.deposits_close_at;
    assert_custom_err(
        init_tx(&mut env, &cfg),
        hanse::HanseError::InvalidConfiguration,
    );

    let mut env = setup();
    let mut cfg = config(3);
    cfg.deposits_close_at = NOW;
    assert_custom_err(
        init_tx(&mut env, &cfg),
        hanse::HanseError::InvalidConfiguration,
    );

    let mut env = setup();
    let mut cfg = config(3);
    cfg.pull_window = 0;
    assert_custom_err(
        init_tx(&mut env, &cfg),
        hanse::HanseError::InvalidConfiguration,
    );
}

#[test]
fn bad_tiers_revert() {
    let mut env = setup();
    let mut cfg = config(4);
    cfg.tiers[1].contribution = 0;
    assert_custom_err(
        init_tx(&mut env, &cfg),
        hanse::HanseError::InvalidConfiguration,
    );

    let mut env = setup();
    let mut cfg = config(4);
    cfg.tiers[2].max_payout = cfg.tiers[2].contribution - 1;
    assert_custom_err(
        init_tx(&mut env, &cfg),
        hanse::HanseError::InvalidConfiguration,
    );
}

#[test]
fn even_jury_size_and_ladder_revert() {
    let mut env = setup();
    let mut cfg = config(5);
    cfg.subaccord.min_jury_size = 4;
    assert_custom_err(init_tx(&mut env, &cfg), hanse::HanseError::InvalidJurySize);

    // Ladder (J+1)·2^appeals − 1 must fit accord MAX_JURORS = 31:
    // J=5, appeals=3 → 6·8 − 1 = 47 > 31.
    let mut env = setup();
    let mut cfg = config(5);
    cfg.subaccord.min_jury_size = 5;
    cfg.subaccord.max_appeals = 3;
    assert_custom_err(init_tx(&mut env, &cfg), hanse::HanseError::InvalidJurySize);
}
