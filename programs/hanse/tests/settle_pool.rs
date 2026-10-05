//! settle_pool tests (EVENT-MUTUAL §2.5/§7, bean riprap-77ty): the frozen
//! pro-rata ratio — solvent, over-treasury, and the gate rows.

mod common;

use {
    anchor_lang::{InstructionData, ToAccountMetas},
    common::*,
    solana_keypair::Keypair,
    solana_signer::Signer,
};

fn settle_pool_tx(env: &mut Env, cranker: &Keypair) -> Result<(), String> {
    use anchor_lang::solana_program::instruction::Instruction;
    let mutual = mutual_pda(1);
    let ix = Instruction::new_with_bytes(
        hanse::id(),
        &hanse::instruction::SettlePool {}.data(),
        hanse::accounts::SettlePool {
            cranker: cranker.pubkey(),
            mutual,
            treasury: pool_treasury(&pool_pda(1), &env.mint),
            fee_float: ata(&mutual_pda(1), &env.mint),
            token_program: spl_token_interface::ID,
        }
        .to_account_metas(None),
    );
    try_send(&mut env.svm, &[ix], &mut [cranker])
}

/// Boot a mutual with `members` joined at tier 1 ($20) and `claims` filed;
/// each claim is finalized `approve` (index 0) and settled through the real
/// instruction. Clock parked just past claims_close_at.
fn setup_settlement(members: u8, claims: u8) -> (Env, hanse::instructions::InitializeMutualConfig) {
    let (mut env, cfg) = setup_with_mutual(1);
    init_accord_state(&mut env);
    arm_subaccord(&mut env, &cfg, 3);

    let mut wallets = Vec::new();
    for _ in 0..members {
        let (member, ata_addr) = member_with(&mut env, 50_000_000);
        join_member(&mut env, &cfg, &member, &ata_addr, 1).unwrap();
        env.svm.expire_blockhash();
        wallets.push(member);
    }
    for (i, member) in wallets.iter().enumerate() {
        if (i as u8) < claims {
            file_claim_raw(&mut env, &cfg, member, 1_000_000).unwrap();
            env.svm.expire_blockhash();
            let mutual = mutual_pda(1);
            force_final(&mut env.svm, &dispute_pda(&mutual, i as u64), 0);
            let crank = cranker(&mut env);
            settle_claim_raw(&mut env, &cfg, &crank, i as u64).unwrap();
            env.svm.expire_blockhash();
        }
    }
    warp_clock(&mut env.svm, cfg.claims_close_at);
    (env, cfg)
}

fn ratio(env: &Env) -> (u64, i64, hanse::state::Phase) {
    let m: hanse::Mutual = anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env.svm.get_account(&mutual_pda(1)).unwrap().data[..],
    )
    .unwrap();
    (m.ratio_1e9, m.pull_close_at, m.phase)
}

/// §2.5/§8: solvent — treasury covers obligations + refunds: ratio = 1e9.
#[test]
fn solvent_settles_at_full_ratio() {
    let (mut env, _cfg) = setup_settlement(2, 1);
    let before = env.svm.get_sysvar::<solana_clock::Clock>().unix_timestamp;
    let crank = cranker(&mut env);
    settle_pool_tx(&mut env, &crank).unwrap();

    let (r, pull_close, phase) = ratio(&env);
    assert_eq!(r, 1_000_000_000);
    assert_eq!(phase, hanse::state::Phase::Settled);
    assert_eq!(
        pull_close,
        before + hanse::PULL_WINDOW_SECS,
        "pull_close_at = settled_at + PULL_WINDOW_SECS (§2.5)"
    );
}

/// §8 pro-rata reduction: 2 × $20 members (treasury 40e6), 2 approved claims
/// of 1e6 each + 2 × 3e6 fees → denominator 8e6 < 40e6... use big claims to
/// force over-treasury: hand math must match to the lamport.
#[test]
fn over_treasury_ratio_matches_hand_math_exactly() {
    // Treasury 40_000_000 (2 × tier 1). Claims: 2 × 20_000_000 approved +
    // fees 2 × 4_000_000 ((3+1) × 1e6, ADR-0030) → denominator 48_000_000 >
    // treasury → ratio floors.
    let (mut env, _cfg) = setup_settlement_big_claims();
    let crank = cranker(&mut env);
    settle_pool_tx(&mut env, &crank).unwrap();

    let treasury = 40_000_000u64;
    let denominator = 2 * 20_000_000u64 + 2 * 4_000_000;
    let expected = (treasury as u128 * 1_000_000_000u128 / denominator as u128) as u64;
    let (r, _, phase) = ratio(&env);
    assert_eq!(r, expected, "u128 floor division, §2.5 formula");
    assert_eq!(
        r, 833_333_333,
        "§8 hand math: 40e6 × 1e9 / 48e6 = 833333333.33 → floor"
    );
    assert_eq!(phase, hanse::state::Phase::Settled);
    assert!(r < 1_000_000_000);
}

fn setup_settlement_big_claims() -> (Env, hanse::instructions::InitializeMutualConfig) {
    let (mut env, cfg) = setup_with_mutual(1);
    init_accord_state(&mut env);
    arm_subaccord(&mut env, &cfg, 3);
    let m1 = member_with(&mut env, 50_000_000);
    let m2 = member_with(&mut env, 50_000_000);
    join_member(&mut env, &cfg, &m1.0, &m1.1, 1).unwrap();
    env.svm.expire_blockhash();
    join_member(&mut env, &cfg, &m2.0, &m2.1, 1).unwrap();
    env.svm.expire_blockhash();
    file_claim_raw(&mut env, &cfg, &m1.0, 20_000_000).unwrap();
    env.svm.expire_blockhash();
    file_claim_raw(&mut env, &cfg, &m2.0, 20_000_000).unwrap();
    env.svm.expire_blockhash();
    let mutual = mutual_pda(1);
    force_final(&mut env.svm, &dispute_pda(&mutual, 0), 0);
    force_final(&mut env.svm, &dispute_pda(&mutual, 1), 0);
    let crank = cranker(&mut env);
    settle_claim_raw(&mut env, &cfg, &crank, 0).unwrap();
    env.svm.expire_blockhash();
    settle_claim_raw(&mut env, &cfg, &crank, 1).unwrap();
    warp_clock(&mut env.svm, cfg.claims_close_at);
    (env, cfg)
}

/// §2.5: no obligations → ratio 1e9 (everything is residual).
#[test]
fn zero_obligations_settles_at_full_ratio() {
    let (mut env, _cfg) = setup_settlement(1, 0);
    let crank = cranker(&mut env);
    settle_pool_tx(&mut env, &crank).unwrap();
    assert_eq!(ratio(&env).0, 1_000_000_000);
}

#[test]
fn open_window_reverts() {
    let (mut env, cfg) = setup_settlement(1, 0);
    warp_clock(&mut env.svm, cfg.claims_close_at - 1);
    let crank = cranker(&mut env);
    assert_custom_err(
        settle_pool_tx(&mut env, &crank),
        hanse::HanseError::ClaimsWindowOpen,
    );
}

#[test]
fn pending_claim_reverts() {
    // File but do not settle the dispute.
    let (mut env, cfg) = setup_with_mutual(1);
    init_accord_state(&mut env);
    arm_subaccord(&mut env, &cfg, 3);
    let (member, ata_addr) = member_with(&mut env, 50_000_000);
    join_member(&mut env, &cfg, &member, &ata_addr, 1).unwrap();
    env.svm.expire_blockhash();
    file_claim_raw(&mut env, &cfg, &member, 1_000_000).unwrap();
    warp_clock(&mut env.svm, cfg.claims_close_at);
    let crank = cranker(&mut env);
    assert_custom_err(
        settle_pool_tx(&mut env, &crank),
        hanse::HanseError::ClaimsUnresolved,
    );
}

#[test]
fn double_settle_reverts() {
    let (mut env, _cfg) = setup_settlement(1, 0);
    let crank = cranker(&mut env);
    settle_pool_tx(&mut env, &crank).unwrap();
    env.svm.expire_blockhash();
    assert_custom_err(
        settle_pool_tx(&mut env, &crank),
        hanse::HanseError::AlreadySettled,
    );
}

fn fund_float(env: &mut Env, amount: u64) {
    use anchor_lang::solana_program::instruction::Instruction;
    use spl_token_interface::instruction as token_ix;
    let float = ata(&mutual_pda(1), &env.mint);
    let ix: Instruction = token_ix::mint_to(
        &spl_token_interface::ID,
        &env.mint,
        &float,
        &env.payer.pubkey(),
        &[],
        amount,
    )
    .unwrap();
    send(&mut env.svm, &[ix], &mut [&env.payer]);
}

/// Amendment 2026-09-25 (audit H-2): settle_pool sweeps the fee float into
/// the treasury BEFORE freezing the ratio — a Failed claim's fee rides the
/// ratio, and accord's (possibly short) refund joins the pot. A short float
/// must not and does not revert settlement.
#[test]
fn failed_fee_float_swept_into_treasury_before_ratio() {
    let (mut env, cfg) = setup_with_mutual(1);
    init_accord_state(&mut env);
    arm_subaccord(&mut env, &cfg, 3);
    let (member, ata_addr) = member_with(&mut env, 50_000_000);
    join_member(&mut env, &cfg, &member, &ata_addr, 1).unwrap();
    env.svm.expire_blockhash();
    file_claim_raw(&mut env, &cfg, &member, 1_000_000).unwrap();
    env.svm.expire_blockhash();
    // accord's resolve-then-fail refund lands short (pre-ADR-0033 shape)
    fund_float(&mut env, 4_000_000 - 1_000_000);
    let mutual = mutual_pda(1);
    force_failed(&mut env.svm, &dispute_pda(&mutual, 0));
    let crank = cranker(&mut env);
    settle_claim_raw(&mut env, &cfg, &crank, 0).unwrap();
    env.svm.expire_blockhash();
    warp_clock(&mut env.svm, cfg.claims_close_at);

    let treasury = pool_treasury(&pool_pda(1), &env.mint);
    let treasury_before = token_amount(&env.svm, &treasury);
    settle_pool_tx(&mut env, &crank).unwrap();

    assert_eq!(
        token_amount(&env.svm, &ata(&mutual, &env.mint)),
        0,
        "float swept"
    );
    assert_eq!(
        token_amount(&env.svm, &treasury),
        treasury_before + 3_000_000,
        "treasury grew by the swept (short) refund (4e6 fee − 1e6 consumed)"
    );
    let (r, _, phase) = ratio(&env);
    assert_eq!(phase, hanse::state::Phase::Settled);
    assert_eq!(r, 1_000_000_000, "solvent: 23e6 treasury ≥ 4e6 fee refunds");
}
