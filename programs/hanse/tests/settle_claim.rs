//! settle_claim tests (EVENT-MUTUAL §7, bean riprap-9pdc): the permissionless
//! crank reads the Dispute ruling directly and books the outcome.

mod common;

use {
    anchor_lang::{solana_program::pubkey::Pubkey, InstructionData, ToAccountMetas},
    common::*,
    solana_keypair::Keypair,
    solana_signer::Signer,
};

const FEE: u64 = 3 * 1_000_000;

fn settle_tx(
    env: &mut Env,
    cfg: &hanse::instructions::InitializeMutualConfig,
    cranker: &Keypair,
    claim_nonce: u64,
    dispute: Option<Pubkey>,
) -> Result<(), String> {
    use anchor_lang::solana_program::instruction::Instruction;
    let mutual = mutual_pda(cfg.seed);
    let claim = claim_pda(&mutual, claim_nonce);
    let c: hanse::Claim = anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env.svm.get_account(&claim).unwrap().data[..],
    )
    .unwrap();
    let dispute = dispute.unwrap_or(c.dispute);
    let ix = Instruction::new_with_bytes(
        hanse::id(),
        &hanse::instruction::SettleClaim {}.data(),
        hanse::accounts::SettleClaim {
            cranker: cranker.pubkey(),
            mutual,
            claim,
            member_account: member_pda(&mutual, &c.member),
            dispute,
            fee_float: ata(&mutual, &env.mint),
            claimant_ata: ata(&c.member, &env.mint),
            fee_mint: env.mint,
            token_program: spl_token_interface::ID,
        }
        .to_account_metas(None),
    );
    try_send(&mut env.svm, &[ix], &mut [cranker])
}

/// File one claim (member at `tier`, `requested`) and return the env with the
/// dispute sitting in Created — ready for terminal fabrication.
fn setup_filed(
    tier: u8,
    requested: u64,
) -> (
    Env,
    hanse::instructions::InitializeMutualConfig,
    Keypair,
    anchor_lang::prelude::Pubkey,
) {
    let (mut env, cfg) = setup_with_mutual(1);
    init_accord_state(&mut env);
    arm_subaccord(&mut env, &cfg, 3);
    let (member, member_ata) = member_with(&mut env, 50_000_000);
    join_member(&mut env, &cfg, &member, &member_ata, tier).unwrap();
    env.svm.expire_blockhash();
    file_claim_any(&mut env, &cfg, &member, requested).unwrap();
    (env, cfg, member, member_ata)
}

fn file_claim_any(
    env: &mut Env,
    cfg: &hanse::instructions::InitializeMutualConfig,
    member: &Keypair,
    requested: u64,
) -> Result<(), String> {
    use anchor_lang::solana_program::instruction::Instruction;
    let mutual = mutual_pda(cfg.seed);
    let m: hanse::Mutual = anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env.svm.get_account(&mutual).unwrap().data[..],
    )
    .unwrap();
    let nonce = m.claim_nonce;
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
    let dispute = Pubkey::find_program_address(
        &[b"dispute", mutual.as_ref(), nonce.to_le_bytes().as_ref()],
        &accord::id(),
    )
    .0;
    let ix = Instruction::new_with_bytes(
        hanse::id(),
        &hanse::instruction::FileClaim {
            requested,
            evidence_hash: [1; 32],
            nonce,
        }
        .data(),
        hanse::accounts::FileClaim {
            claimant: member.pubkey(),
            rent_payer: member.pubkey(),
            mutual,
            member_account: member_pda(&mutual, &member.pubkey()),
            claim: claim_pda(&mutual, nonce),
            depositor: pool_depositor(&pool, &member.pubkey()),
            subaccord,
            member_fee_ata: ata(&member.pubkey(), &env.mint),
            fee_float: ata(&mutual, &env.mint),
            fee_mint: env.mint,
            treasury: pool_treasury(&pool, &env.mint),
            dispute,
            fee_vault: ata(&subaccord, &env.mint),
            accord_state: Pubkey::find_program_address(&[b"state"], &accord::id()).0,
            token_program: spl_token_interface::ID,
            associated_token_program: spl_associated_token_account_interface::program::ID,
            system_program: anchor_lang::solana_program::system_program::ID,
            accord_program: accord::id(),
        }
        .to_account_metas(None),
    );
    try_send(&mut env.svm, &[ix], &mut [member])
}

fn read_claim(env: &Env, nonce: u64) -> hanse::Claim {
    anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env
            .svm
            .get_account(&claim_pda(&mutual_pda(1), nonce))
            .unwrap()
            .data[..],
    )
    .unwrap()
}

#[test]
fn approve_books_obligations_and_fee_refund() {
    let (mut env, cfg, _member, _) = setup_filed(1, 1_500_000_000);
    let mutual = mutual_pda(1);
    force_final(&mut env.svm, &dispute_pda(&mutual, 0), 0);
    warp_clock(&mut env.svm, cfg.claims_close_at + 1_000);

    let crank = cranker(&mut env);
    settle_tx(&mut env, &cfg, &crank, 0, None).unwrap();

    let c = read_claim(&env, 0);
    assert_eq!(c.status, hanse::state::ClaimStatus::Approved);
    let m: hanse::Mutual = anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env.svm.get_account(&mutual).unwrap().data[..],
    )
    .unwrap();
    assert_eq!(m.obligations, 1_500_000_000);
    assert_eq!(m.fee_refunds, FEE);
    assert_eq!(m.claims_resolved, 1);
    assert_eq!(c.settled_at, cfg.claims_close_at + 1_000);
    let mem = member_of(&env, &c.member);
    assert!(!mem.has_pending_claim);
    // The crank moved no pool money on approve.
    assert_eq!(
        token_amount(&env.svm, &pool_treasury(&pool_pda(1), &env.mint)),
        20_000_000
    );
}

#[test]
fn deny_moves_nothing() {
    let (mut env, cfg, _member, _) = setup_filed(1, 1_500_000_000);
    force_final(&mut env.svm, &dispute_pda(&mutual_pda(1), 0), 1);

    let crank = cranker(&mut env);
    settle_tx(&mut env, &cfg, &crank, 0, None).unwrap();

    let c = read_claim(&env, 0);
    assert_eq!(c.status, hanse::state::ClaimStatus::Denied);
    let m: hanse::Mutual = anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env.svm.get_account(&mutual_pda(1)).unwrap().data[..],
    )
    .unwrap();
    assert_eq!((m.obligations, m.fee_refunds, m.claims_resolved), (0, 0, 1));
}

#[test]
fn failed_refunds_fee_to_claimant() {
    let (mut env, cfg, _member, member_ata) = setup_filed(1, 100);
    let before = token_amount(&env.svm, &member_ata);
    // accord's cancel_dispute refunds the filer fee vault -> float; simulate
    // that refund landing, then settle forwards it to the claimant.
    fund_float(&mut env, &cfg, FEE);

    force_failed(&mut env.svm, &dispute_pda(&mutual_pda(1), 0));
    let crank = cranker(&mut env);
    settle_tx(&mut env, &cfg, &crank, 0, None).unwrap();

    let c = read_claim(&env, 0);
    assert_eq!(c.status, hanse::state::ClaimStatus::Failed);
    assert_eq!(token_amount(&env.svm, &member_ata), before + FEE);
    assert_eq!(token_amount(&env.svm, &ata(&mutual_pda(1), &env.mint)), 0);
    let m: hanse::Mutual = anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env.svm.get_account(&mutual_pda(1)).unwrap().data[..],
    )
    .unwrap();
    assert_eq!((m.obligations, m.fee_refunds), (0, 0));
}

#[test]
fn double_settle_reverts() {
    let (mut env, cfg, _member, _) = setup_filed(1, 100);
    force_final(&mut env.svm, &dispute_pda(&mutual_pda(1), 0), 0);
    let crank = cranker(&mut env);
    settle_tx(&mut env, &cfg, &crank, 0, None).unwrap();
    env.svm.expire_blockhash();
    let crank = cranker(&mut env);
    assert_custom_err(
        settle_tx(&mut env, &cfg, &crank, 0, None),
        hanse::HanseError::ClaimNotPending,
    );
}

#[test]
fn wrong_dispute_account_reverts() {
    let (mut env, cfg, _member, _) = setup_filed(1, 100);
    // A real, accord-owned dispute — but a different one than the claim's.
    let mutual = mutual_pda(1);
    let other = dispute_pda(&mutual, 99);
    plant_dispute(&mut env.svm, &other, &base_dispute(mutual, 99));
    force_final(&mut env.svm, &other, 0);
    let crank = cranker(&mut env);
    assert_custom_err(
        settle_tx(&mut env, &cfg, &crank, 0, Some(other)),
        hanse::HanseError::WrongDispute,
    );
}

#[test]
fn non_terminal_dispute_reverts() {
    let (mut env, cfg, _member, _) = setup_filed(1, 100);
    // Freshly filed: still Created.
    let crank = cranker(&mut env);
    assert_custom_err(
        settle_tx(&mut env, &cfg, &crank, 0, None),
        hanse::HanseError::DisputeNotFinal,
    );
}

// ── local helpers ───────────────────────────────────────────────────────────

fn cranker(env: &mut Env) -> Keypair {
    let k = Keypair::new();
    env.svm.airdrop(&k.pubkey(), 1_000_000_000).unwrap();
    k
}

fn member_of(env: &Env, member: &Pubkey) -> hanse::Member {
    anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env
            .svm
            .get_account(&member_pda(&mutual_pda(1), member))
            .unwrap()
            .data[..],
    )
    .unwrap()
}

fn fund_float(env: &mut Env, cfg: &hanse::instructions::InitializeMutualConfig, amount: u64) {
    use spl_token_interface::instruction as token_ix;
    let float = ata(&mutual_pda(cfg.seed), &env.mint);
    send(
        &mut env.svm,
        &[token_ix::mint_to(
            &spl_token_interface::ID,
            &env.mint,
            &float,
            &env.payer.pubkey(),
            &[],
            amount,
        )
        .unwrap()],
        &mut [&env.payer],
    );
}
