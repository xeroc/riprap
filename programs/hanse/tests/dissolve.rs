//! dissolve tests (EVENT-MUTUAL §7, bean riprap-2os6): the terminal crank —
//! liquidate the pool from the mutual_own PDA after the pull window; the
//! residual belongs to the pool crank directly.

mod common;

use {
    anchor_lang::{InstructionData, ToAccountMetas},
    common::*,
    solana_keypair::Keypair,
    solana_signer::Signer,
};

const CLAIM: u64 = 2_000_000_000;
const FEE: u64 = 15_000_000;

/// Full §8-scale lifecycle to Settled (see claim_payout.rs): `members`
/// joined at $20, `claims` approved at $2,000/$15, treasury topped to $20,000.
fn setup_settled(
    members: u8,
    claims: u8,
    topup: u64,
) -> (
    Env,
    hanse::instructions::InitializeMutualConfig,
    Vec<Keypair>,
    Keypair,
) {
    let mut cfg = default_config(9);
    cfg.subaccord.fee_per_juror = 5_000_000; // §8: $5/juror → $15 fee
    let mut env = Env::setup().unwrap();
    warp_clock(&mut env.svm, INIT_TEST_NOW);
    init_mutual(&mut env, &cfg).unwrap();
    init_accord_state(&mut env);
    arm_subaccord(&mut env, &cfg, 3);

    let mut wallets = Vec::new();
    for _ in 0..members {
        let (m, ata_addr) = member_with(&mut env, 3_000_000_000);
        join_member(&mut env, &cfg, &m, &ata_addr, 1).unwrap();
        env.svm.expire_blockhash();
        wallets.push(m);
    }
    for (i, m) in wallets.iter().enumerate() {
        if (i as u8) < claims {
            file_claim_raw(&mut env, &cfg, m, CLAIM).unwrap();
            env.svm.expire_blockhash();
            let mutual = mutual_pda(cfg.seed);
            force_final(&mut env.svm, &dispute_pda(&mutual, i as u64), 0);
            let crank = cranker(&mut env);
            settle_claim_raw(&mut env, &cfg, &crank, i as u64).unwrap();
            env.svm.expire_blockhash();
        }
    }
    if topup > 0 {
        use spl_token_interface::instruction as token_ix;
        send(
            &mut env.svm,
            &[token_ix::mint_to(
                &spl_token_interface::ID,
                &env.mint,
                &pool_treasury(&pool_pda(cfg.seed), &env.mint),
                &env.payer.pubkey(),
                &[],
                topup,
            )
            .unwrap()],
            &mut [&env.payer],
        );
    }
    warp_clock(&mut env.svm, cfg.claims_close_at);
    settle_pool_crank(&mut env, &cfg).unwrap();
    let admin = Keypair::try_from(&env.payer.to_bytes()[..]).unwrap();
    (env, cfg, wallets, admin)
}

fn settle_pool_crank(
    env: &mut Env,
    cfg: &hanse::instructions::InitializeMutualConfig,
) -> Result<(), String> {
    let crank = cranker(env);
    let mutual = mutual_pda(cfg.seed);
    let ix = anchor_lang::solana_program::instruction::Instruction::new_with_bytes(
        hanse::id(),
        &hanse::instruction::SettlePool {}.data(),
        hanse::accounts::SettlePool {
            cranker: crank.pubkey(),
            mutual,
            treasury: pool_treasury(&pool_pda(cfg.seed), &env.mint),
        }
        .to_account_metas(None),
    );
    try_send(&mut env.svm, &[ix], &mut [&crank])
}

fn dissolve_tx2(
    env: &mut Env,
    cfg: &hanse::instructions::InitializeMutualConfig,
    crank: &Keypair,
) -> Result<(), String> {
    let mutual = mutual_pda(cfg.seed);
    let ix = anchor_lang::solana_program::instruction::Instruction::new_with_bytes(
        hanse::id(),
        &hanse::instruction::Dissolve {}.data(),
        hanse::accounts::Dissolve {
            cranker: crank.pubkey(),
            mutual,
            ownership_authority: mutual_own_pda(&mutual),
            pool: pool_pda(cfg.seed),
            treasury: pool_treasury(&pool_pda(cfg.seed), &env.mint),
            token_program: spl_token_interface::ID,
            pool_program: pool::id(),
        }
        .to_account_metas(None),
    );
    try_send(&mut env.svm, &[ix], &mut [crank])
}

fn pool_state(env: &Env, cfg: &hanse::instructions::InitializeMutualConfig) -> pool::Pool {
    anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env.svm.get_account(&pool_pda(cfg.seed)).unwrap().data[..],
    )
    .unwrap()
}

fn mutual_state(env: &Env, cfg: &hanse::instructions::InitializeMutualConfig) -> hanse::Mutual {
    anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env.svm.get_account(&mutual_pda(cfg.seed)).unwrap().data[..],
    )
    .unwrap()
}

#[test]
fn dissolve_liquidates_pool_and_snapshots_residual() {
    let (mut env, cfg, _wallets, _admin) = setup_settled(1, 1, 20_000_000_000 - 20_000_000);
    let pull_close_at = mutual_state(&env, &cfg).pull_close_at;
    warp_clock(&mut env.svm, pull_close_at);

    let crank = cranker(&mut env);
    dissolve_tx2(&mut env, &cfg, &crank).unwrap();

    let p = pool_state(&env, &cfg);
    assert_eq!(p.state, pool::PoolState::Liquidated);
    assert_eq!(
        p.liquidation_balance,
        token_amount(&env.svm, &pool_treasury(&pool_pda(cfg.seed), &env.mint)),
        "the residual snapshot is the crank base"
    );
    assert_eq!(
        mutual_state(&env, &cfg).phase,
        hanse::state::Phase::Dissolved
    );
}

#[test]
fn early_dissolve_reverts() {
    let (mut env, cfg, _w, _a) = setup_settled(1, 1, 20_000_000_000 - 20_000_000);
    let pull_close_at = mutual_state(&env, &cfg).pull_close_at;
    warp_clock(&mut env.svm, pull_close_at - 1);
    let crank = cranker(&mut env);
    assert_custom_err(
        dissolve_tx2(&mut env, &cfg, &crank),
        hanse::HanseError::PullWindowOpen,
    );
}

#[test]
fn double_dissolve_reverts() {
    let (mut env, cfg, _w, _a) = setup_settled(1, 1, 20_000_000_000 - 20_000_000);
    let pull_close_at = mutual_state(&env, &cfg).pull_close_at;
    warp_clock(&mut env.svm, pull_close_at);
    let crank = cranker(&mut env);
    dissolve_tx2(&mut env, &cfg, &crank).unwrap();
    env.svm.expire_blockhash();
    assert_custom_err(
        dissolve_tx2(&mut env, &cfg, &crank),
        hanse::HanseError::NotSettled,
    );
}

/// §8 end-to-end with the burn integration: the paid claimant burned out of
/// the residual; after dissolve the pool crank pays ONLY the non-burned
/// member — the full residual lands on them, nothing on the burned one.
#[test]
fn post_dissolve_crank_pays_only_non_burned_depositors() {
    let topup = 20_000_000_000 - 2 * 20_000_000;
    let (mut env, cfg, wallets, admin) = setup_settled(2, 1, topup);

    // Claimant 0 is paid: $2,015 out, stake burned to zero (§8 solvent row).
    payout(&mut env, &cfg, &admin, 0).unwrap();
    let treasury = pool_treasury(&pool_pda(cfg.seed), &env.mint);
    let residual = token_amount(&env.svm, &treasury);
    assert_eq!(
        residual,
        20_000_000_000 - (CLAIM + FEE),
        "§8: $20,000 − $2,015"
    );

    let pull_close_at = mutual_state(&env, &cfg).pull_close_at;
    warp_clock(&mut env.svm, pull_close_at);
    let crank = cranker(&mut env);
    dissolve_tx2(&mut env, &cfg, &crank).unwrap();

    // The BURNED member cranks: zero share (total_amount burned to 0).
    let burned_ata = ata(&wallets[0].pubkey(), &env.mint);
    let before = token_amount(&env.svm, &burned_ata);
    pool_crank(&mut env, &cfg, &crank, &wallets[0]).unwrap();
    assert_eq!(
        token_amount(&env.svm, &burned_ata) - before,
        0,
        "burned claimant is out of the residual split (§2.4)"
    );

    // The other member cranks: the entire residual (sole remaining
    // depositor — §8: 'if claims don't consume the pool, the money comes
    // back').
    let other_ata = ata(&wallets[1].pubkey(), &env.mint);
    let before_crank = token_amount(&env.svm, &other_ata);
    pool_crank(&mut env, &cfg, &crank, &wallets[1]).unwrap();
    assert_eq!(token_amount(&env.svm, &other_ata) - before_crank, residual);
}

// ── local helpers ───────────────────────────────────────────────────────────

fn payout(
    env: &mut Env,
    cfg: &hanse::instructions::InitializeMutualConfig,
    cranker: &Keypair,
    nonce: u64,
) -> Result<(), String> {
    let mutual = mutual_pda(cfg.seed);
    let pool = pool_pda(cfg.seed);
    let claim = claim_pda(&mutual, nonce);
    let c: hanse::Claim = anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env.svm.get_account(&claim).unwrap().data[..],
    )
    .unwrap();
    let ix = anchor_lang::solana_program::instruction::Instruction::new_with_bytes(
        hanse::id(),
        &hanse::instruction::ClaimPayout {}.data(),
        hanse::accounts::ClaimPayout {
            cranker: cranker.pubkey(),
            claimant: c.member,
            rights_authority: mutual_auth_pda(&mutual),
            mutual,
            claim,
            pool,
            depositor: pool_depositor(&pool, &c.member),
            treasury: pool_treasury(&pool, &env.mint),
            destination: ata(&c.member, &env.mint),
            deposit_mint: env.mint,
            token_program: spl_token_interface::ID,
            pool_program: pool::id(),
        }
        .to_account_metas(None),
    );
    try_send(&mut env.svm, &[ix], &mut [cranker])
}

fn pool_crank(
    env: &mut Env,
    cfg: &hanse::instructions::InitializeMutualConfig,
    cranker: &Keypair,
    owner: &Keypair,
) -> Result<(), String> {
    let pool = pool_pda(cfg.seed);
    let ix = anchor_lang::solana_program::instruction::Instruction::new_with_bytes(
        pool::id(),
        &pool::instruction::Crank {}.data(),
        pool::accounts::Crank {
            pool,
            cranker: cranker.pubkey(),
            depositor: pool_depositor(&pool, &owner.pubkey()),
            owner: owner.pubkey(),
            destination: ata(&owner.pubkey(), &env.mint),
            treasury: pool_treasury(&pool, &env.mint),
            token_program: spl_token_interface::ID,
            associated_token_program: spl_associated_token_account_interface::program::ID,
        }
        .to_account_metas(None),
    );
    try_send(&mut env.svm, &[ix], &mut [cranker])
}
