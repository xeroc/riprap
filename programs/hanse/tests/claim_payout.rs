//! claim_payout tests (EVENT-MUTUAL §2.4/§7 + §8 numbers, bean riprap-6zfr):
//! the payout crank against the frozen ratio — the claimant never signs;
//! the pilot pass gate pins the cranker to mutual.authority.

mod common;

use {
    anchor_lang::{solana_program::pubkey::Pubkey, InstructionData, ToAccountMetas},
    common::*,
    solana_keypair::Keypair,
    solana_signer::Signer,
};

/// §8 pilot economics: $2,000 claim cap, $5-per-juror fee × 3 = $15.
const CLAIM: u64 = 2_000_000_000;
const FEE: u64 = 15_000_000;

fn payout_tx(
    env: &mut Env,
    cfg: &hanse::instructions::InitializeMutualConfig,
    cranker: &Keypair,
    claim_nonce: u64,
    destination: Option<Pubkey>,
) -> Result<(), String> {
    use anchor_lang::solana_program::instruction::Instruction;
    let mutual = mutual_pda(cfg.seed);
    let pool = pool_pda(cfg.seed);
    let claim = claim_pda(&mutual, claim_nonce);
    let c: hanse::Claim = anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env.svm.get_account(&claim).unwrap().data[..],
    )
    .unwrap();
    let destination = destination.unwrap_or_else(|| ata(&c.member, &env.mint));
    let ix = Instruction::new_with_bytes(
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
            destination,
            deposit_mint: env.mint,
            token_program: spl_token_interface::ID,
            pool_program: pool::id(),
        }
        .to_account_metas(None),
    );
    try_send(&mut env.svm, &[ix], &mut [cranker])
}

/// Drive the real lifecycle to Settled: `members` joined at tier 1 ($20),
/// `claims` approved at $2,000 (tier cap) with $15 fees, then settle_pool.
/// `treasury_topup` mints the §8-scale treasury (models the remaining
/// membership — §8: 1,000 × $20 = $20,000).
fn setup_payout_full(
    members: u8,
    claims: u8,
    treasury_topup: u64,
) -> (
    Env,
    hanse::instructions::InitializeMutualConfig,
    Vec<Keypair>,
    Keypair,
) {
    let mut cfg = default_config(7);
    cfg.subaccord.fee_per_juror = 5_000_000; // §8: $5/juror → $15 filing fee
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
    if treasury_topup > 0 {
        use spl_token_interface::instruction as token_ix;
        send(
            &mut env.svm,
            &[token_ix::mint_to(
                &spl_token_interface::ID,
                &env.mint,
                &pool_treasury(&pool_pda(cfg.seed), &env.mint),
                &env.payer.pubkey(),
                &[],
                treasury_topup,
            )
            .unwrap()],
            &mut [&env.payer],
        );
    }
    warp_clock(&mut env.svm, cfg.claims_close_at);
    let crank = cranker(&mut env);
    settle_pool_raw(&mut env, &cfg, &crank).unwrap();
    let admin = Keypair::try_from(&env.payer.to_bytes()[..]).unwrap();
    (env, cfg, wallets, admin)
}

fn settle_pool_raw(
    env: &mut Env,
    cfg: &hanse::instructions::InitializeMutualConfig,
    cranker: &Keypair,
) -> Result<(), String> {
    use anchor_lang::solana_program::instruction::Instruction;
    let mutual = mutual_pda(cfg.seed);
    let ix = Instruction::new_with_bytes(
        hanse::id(),
        &hanse::instruction::SettlePool {}.data(),
        hanse::accounts::SettlePool {
            cranker: cranker.pubkey(),
            mutual,
            treasury: pool_treasury(&pool_pda(cfg.seed), &env.mint),
        }
        .to_account_metas(None),
    );
    try_send(&mut env.svm, &[ix], &mut [cranker])
}

/// §8 solvent row: ratio 1e9 → the claimant pulls exactly $2,015
/// (2_015_000_000 base units: $2,000 payout + $15 fee refund) and their
/// rights stake burns to zero.
#[test]
fn solvent_payout_is_claim_plus_fee() {
    // §8 scale: 1,000 × $20 = $20,000 treasury; 1 of the §8 four claims.
    let topup = 20_000_000_000 - 20_000_000; // joined member + the other 999
    let (mut env, cfg, wallets, admin) = setup_payout_full(1, 1, topup);

    let claimant = &wallets[0];
    let ata_addr = ata(&claimant.pubkey(), &env.mint);
    let before = token_amount(&env.svm, &ata_addr);
    payout_tx(&mut env, &cfg, &admin, 0, None).unwrap();

    assert_eq!(
        token_amount(&env.svm, &ata_addr) - before,
        2_015_000_000,
        "§8: each claimant pulls $2,015 (payout + fee refund)"
    );

    // Stake burned to zero (§8: "their rights stake burns to 0").
    let d: pool::Depositor = anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env
            .svm
            .get_account(&pool_depositor(&pool_pda(cfg.seed), &claimant.pubkey()))
            .unwrap()
            .data[..],
    )
    .unwrap();
    assert_eq!(d.rights_stake, 0, "burn saturates at the contribution");
    let c = read_claim(&env, cfg.seed, 0);
    assert_eq!(c.status, hanse::state::ClaimStatus::Paid);
}

/// §8 exhausted row: 15 claims at $2,000 + 15 fees vs $20,000 →
/// ratio = floor(20e9 × 1e9 / 30_225_000_000); payout floors per term.
#[test]
fn exhausted_payout_floors_per_term() {
    // 15 members × $20 = $300 → top up to §8's $20,000 (1,000 × $20).
    let topup = 20_000_000_000 - 15 * 20_000_000;
    let (mut env, cfg, wallets, admin) = setup_payout_full(15, 15, topup);

    let claimant = &wallets[0];
    let ata_addr = ata(&claimant.pubkey(), &env.mint);
    let before = token_amount(&env.svm, &ata_addr);
    payout_tx(&mut env, &cfg, &admin, 0, None).unwrap();

    let m: hanse::Mutual = anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env.svm.get_account(&mutual_pda(cfg.seed)).unwrap().data[..],
    )
    .unwrap();
    assert_eq!(
        m.ratio_1e9,
        (20_000_000_000u128 * 1_000_000_000u128 / 30_225_000_000u128) as u64,
        "§8 exhausted ratio"
    );
    let claim_part = CLAIM as u128 * m.ratio_1e9 as u128 / 1_000_000_000;
    let fee_part = FEE as u128 * m.ratio_1e9 as u128 / 1_000_000_000;
    assert_eq!(
        token_amount(&env.svm, &ata_addr) - before,
        (claim_part + fee_part) as u64,
        "§8: $1,323.40 + $9.93 — every claimant identically (two floors)"
    );
    assert_eq!(
        claim_part, 1_323_407_774,
        "§8: $1,323.40 (floor of 2e9 × 661_703_887 / 1e9)"
    );
    assert_eq!(
        fee_part, 9_925_558,
        "§8: $9.93 (floor of 15e6 × 661_703_887 / 1e9)"
    );
}

#[test]
fn non_authority_cranker_reverts() {
    let topup = 20_000_000_000 - 20_000_000;
    let (mut env, cfg, _wallets, _) = setup_payout_full(1, 1, topup);
    let impostor = cranker(&mut env);
    assert_custom_err(
        payout_tx(&mut env, &cfg, &impostor, 0, None),
        hanse::HanseError::Unauthorized,
    );
}

#[test]
fn pull_after_window_reverts() {
    let topup = 20_000_000_000 - 20_000_000;
    let (mut env, cfg, _wallets, admin) = setup_payout_full(1, 1, topup);
    let pull_close_at = {
        let m: hanse::Mutual = anchor_lang::AccountDeserialize::try_deserialize(
            &mut &env.svm.get_account(&mutual_pda(cfg.seed)).unwrap().data[..],
        )
        .unwrap();
        m.pull_close_at
    };
    warp_clock(&mut env.svm, pull_close_at);
    assert_custom_err(
        payout_tx(&mut env, &cfg, &admin, 0, None),
        hanse::HanseError::PullWindowClosed,
    );
}

#[test]
fn double_pull_reverts() {
    let topup = 20_000_000_000 - 20_000_000;
    let (mut env, cfg, _wallets, admin) = setup_payout_full(1, 1, topup);
    payout_tx(&mut env, &cfg, &admin, 0, None).unwrap();
    env.svm.expire_blockhash();
    assert_custom_err(
        payout_tx(&mut env, &cfg, &admin, 0, None),
        hanse::HanseError::ClaimAlreadyPaid,
    );
}

#[test]
fn foreign_destination_reverts() {
    let topup = 20_000_000_000 - 20_000_000;
    let (mut env, cfg, wallets, admin) = setup_payout_full(2, 1, topup);
    let other_ata = ata(&wallets[1].pubkey(), &env.mint);
    assert!(
        payout_tx(&mut env, &cfg, &admin, 0, Some(other_ata)).is_err(),
        "destination must be the claimant's own canonical ATA"
    );
}

fn read_claim(env: &Env, seed: u64, nonce: u64) -> hanse::Claim {
    anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env
            .svm
            .get_account(&claim_pda(&mutual_pda(seed), nonce))
            .unwrap()
            .data[..],
    )
    .unwrap()
}
