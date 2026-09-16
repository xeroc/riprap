//! join tests (EVENT-MUTUAL §2.7/§7, bean riprap-gneb): member-signed entry —
//! one contribution, one tier, one rights stake, before deposits close.

mod common;

use {
    anchor_lang::{InstructionData, ToAccountMetas},
    common::*,
    solana_keypair::Keypair,
    solana_signer::Signer,
    spl_associated_token_account_interface::instruction as ata_ix,
    spl_token_interface::instruction as token_ix,
};

/// Fund a prospective member with `balance` of the deposit mint and create
/// their ATA. Returns (member keypair, ata).
fn member_with(env: &mut Env, balance: u64) -> (Keypair, anchor_lang::prelude::Pubkey) {
    let kp = Keypair::new();
    let ata_addr = ata(&kp.pubkey(), &env.mint);
    env.svm.airdrop(&kp.pubkey(), 1_000_000_000).unwrap();
    send(
        &mut env.svm,
        &[
            ata_ix::create_associated_token_account_idempotent(
                &env.payer.pubkey(),
                &kp.pubkey(),
                &env.mint,
                &spl_token_interface::ID,
            ),
            token_ix::mint_to(
                &spl_token_interface::ID,
                &env.mint,
                &ata_addr,
                &env.payer.pubkey(),
                &[],
                balance,
            )
            .unwrap(),
        ],
        &mut [&env.payer],
    );
    (kp, ata_addr)
}

fn join_tx(
    env: &mut Env,
    cfg: &hanse::instructions::InitializeMutualConfig,
    member: &Keypair,
    member_ata: &anchor_lang::prelude::Pubkey,
    tier: u8,
) -> Result<(), String> {
    join_tx_paying(env, cfg, member, member_ata, tier, member)
}

/// `join_tx` with an explicit rent sponsor — the Member PDA and the pool's
/// depositor PDA both rent to this wallet (v1: the member themself).
fn join_tx_paying(
    env: &mut Env,
    cfg: &hanse::instructions::InitializeMutualConfig,
    member: &Keypair,
    member_ata: &anchor_lang::prelude::Pubkey,
    tier: u8,
    rent_payer: &Keypair,
) -> Result<(), String> {
    use anchor_lang::solana_program::instruction::Instruction;
    let mutual = mutual_pda(cfg.seed);
    let pool = pool_pda(cfg.seed);
    let ix = Instruction::new_with_bytes(
        hanse::id(),
        &hanse::instruction::Join { tier }.data(),
        hanse::accounts::Join {
            member: member.pubkey(),
            funder: None,
            member_account: member_pda(&mutual, &member.pubkey()),
            mutual,
            pool,
            depositor: pool_depositor(&pool, &member.pubkey()),
            owner_ata: *member_ata,
            rent_payer: rent_payer.pubkey(),
            treasury: pool_treasury(&pool, &env.mint),
            deposit_mint: env.mint,
            token_program: spl_token_interface::ID,
            system_program: anchor_lang::solana_program::system_program::ID,
            pool_program: pool::id(),
        }
        .to_account_metas(None),
    );
    if rent_payer.pubkey() == member.pubkey() {
        try_send(&mut env.svm, &[ix], &mut [member])
    } else {
        try_send(&mut env.svm, &[ix], &mut [member, rent_payer])
    }
}

/// §7 happy path: rights stake == contribution (rate 1), Member fields exact.
#[test]
fn join_mints_rights_stake_and_enrolls_member() {
    let (mut env, cfg) = setup_with_mutual(1);
    let (member, member_ata) = member_with(&mut env, 20_000_000);
    join_tx(&mut env, &cfg, &member, &member_ata, 1).unwrap();

    // Pool side: rights stake == contribution at rate 1, treasury got paid.
    let pool = pool_pda(1);
    let d: pool::Depositor = anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env
            .svm
            .get_account(&pool_depositor(&pool, &member.pubkey()))
            .unwrap()
            .data[..],
    )
    .unwrap();
    assert_eq!(d.rights_stake, 20_000_000, "tier 1 = Standard $20 (rate 1)");
    assert_eq!(d.total_amount, 20_000_000);
    assert_eq!(
        token_amount(&env.svm, &pool_treasury(&pool, &env.mint)),
        20_000_000
    );
    assert_eq!(
        token_amount(&env.svm, &member_ata),
        0,
        "contribution left the member's ATA"
    );

    // Member side: fields exact, attestation reserved.
    let m: hanse::Member = anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env
            .svm
            .get_account(&member_pda(&mutual_pda(1), &member.pubkey()))
            .unwrap()
            .data[..],
    )
    .unwrap();
    assert_eq!(m.mutual, mutual_pda(1));
    assert_eq!(m.member, member.pubkey());
    assert_eq!(m.tier, 1);
    assert_eq!(
        m.attestation,
        anchor_lang::prelude::Pubkey::default(),
        "reserved (riprap-7wa9)"
    );
    assert!(!m.has_pending_claim);
}

/// Sponsored cover, the full arc (§7 sponsorship, pool option C): the
/// sponsor's money buys the member's position, the member keeps every claim
/// right, and after settle → dissolve the pool crank pays the leftover to
/// the sponsor's ATA. The member holds nothing throughout.
#[test]
fn sponsored_join_residual_settles_to_sponsor() {
    let (mut env, cfg) = setup_with_mutual(1);
    let (member, _member_ata) = member_with(&mut env, 0); // member is broke on purpose
    use anchor_lang::solana_program::instruction::Instruction;

    // Fund a sponsor wallet (tokens + rent lamports).
    let sponsor = cranker(&mut env);
    let sponsor_ata = ata(&sponsor.pubkey(), &env.mint);
    {
        use spl_associated_token_account_interface::instruction as ata_ix;
        use spl_token_interface::instruction as token_ix;
        send(
            &mut env.svm,
            &[
                ata_ix::create_associated_token_account_idempotent(
                    &env.payer.pubkey(),
                    &sponsor.pubkey(),
                    &env.mint,
                    &spl_token_interface::ID,
                ),
                token_ix::mint_to(
                    &spl_token_interface::ID,
                    &env.mint,
                    &sponsor_ata,
                    &env.payer.pubkey(),
                    &[],
                    20_000_000,
                )
                .unwrap(),
            ],
            &mut [&env.payer],
        );
    }

    // join: member signs (consent), sponsor pays cover + rent.
    let mutual = mutual_pda(cfg.seed);
    let pool = pool_pda(cfg.seed);
    let ix = Instruction::new_with_bytes(
        hanse::id(),
        &hanse::instruction::Join { tier: 1 }.data(),
        hanse::accounts::Join {
            member: member.pubkey(),
            funder: Some(sponsor.pubkey()),
            member_account: member_pda(&mutual, &member.pubkey()),
            mutual,
            pool,
            depositor: pool_depositor(&pool, &member.pubkey()),
            owner_ata: sponsor_ata,
            rent_payer: sponsor.pubkey(),
            treasury: pool_treasury(&pool, &env.mint),
            deposit_mint: env.mint,
            token_program: spl_token_interface::ID,
            system_program: anchor_lang::solana_program::system_program::ID,
            pool_program: pool::id(),
        }
        .to_account_metas(None),
    );
    try_send(&mut env.svm, &[ix], &mut [&member, &sponsor]).unwrap();

    // Member enrolled; position bound to the member, residual to the sponsor.
    let d: pool::Depositor = anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env.svm
            .get_account(&pool_depositor(&pool, &member.pubkey()))
            .unwrap()
            .data[..],
    )
    .unwrap();
    assert_eq!(d.owner, member.pubkey(), "position is the member's");
    assert_eq!(d.residual_beneficiary, sponsor.pubkey());
    assert_eq!(d.total_amount, 20_000_000, "tier 1 = Standard $20");
    assert_eq!(token_amount(&env.svm, &sponsor_ata), 0, "cover fully paid");
    assert_eq!(
        token_amount(&env.svm, &pool_treasury(&pool, &env.mint)),
        20_000_000
    );

    // No claims filed: settle past the claims window, then past the pull
    // window, dissolve, and crank the position — to the sponsor's ATA.
    warp_clock(&mut env.svm, cfg.claims_close_at + 1);
    let cranker_kp = cranker(&mut env);
    send(
        &mut env.svm,
        &[Instruction::new_with_bytes(
            hanse::id(),
            &hanse::instruction::SettlePool {}.data(),
            hanse::accounts::SettlePool {
                cranker: cranker_kp.pubkey(),
                mutual,
                treasury: pool_treasury(&pool, &env.mint),
            }
            .to_account_metas(None),
        )],
        &mut [&cranker_kp],
    );
    warp_clock(&mut env.svm, cfg.claims_close_at + cfg.pull_window + 2);
    send(
        &mut env.svm,
        &[Instruction::new_with_bytes(
            hanse::id(),
            &hanse::instruction::Dissolve {}.data(),
            hanse::accounts::Dissolve {
                cranker: cranker_kp.pubkey(),
                mutual,
                ownership_authority: mutual_own_pda(&mutual),
                pool,
                treasury: pool_treasury(&pool, &env.mint),
                token_program: spl_token_interface::ID,
                pool_program: pool::id(),
            }
            .to_account_metas(None),
        )],
        &mut [&cranker_kp],
    );
    send(
        &mut env.svm,
        &[Instruction::new_with_bytes(
            pool::id(),
            &pool::instruction::Crank {}.data(),
            pool::accounts::Crank {
                pool,
                cranker: cranker_kp.pubkey(),
                depositor: pool_depositor(&pool, &member.pubkey()),
                owner: member.pubkey(),
                destination: sponsor_ata,
                treasury: pool_treasury(&pool, &env.mint),
                token_program: spl_token_interface::ID,
                associated_token_program:
                    spl_associated_token_account_interface::program::ID,
            }
            .to_account_metas(None),
        )],
        &mut [&cranker_kp],
    );

    // The leftover is the sponsor's; nothing ever landed on the member.
    assert_eq!(token_amount(&env.svm, &sponsor_ata), 20_000_000);
}

/// Rent sponsorship: a third-party wallet funds both init sites (Member
/// PDA + depositor PDA); the member still signs and is recorded unchanged —
/// the sponsor buys nothing but the rent bills.
#[test]
fn join_rent_sponsored_by_third_party() {
    let (mut env, cfg) = setup_with_mutual(1);
    let (member, member_ata) = member_with(&mut env, 20_000_000);
    let sponsor = cranker(&mut env);
    let before = env
        .svm
        .get_account(&sponsor.pubkey())
        .unwrap()
        .lamports;
    join_tx_paying(&mut env, &cfg, &member, &member_ata, 1, &sponsor).unwrap();

    let m: hanse::Member = anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env.svm
            .get_account(&member_pda(&mutual_pda(1), &member.pubkey()))
            .unwrap()
            .data[..],
    )
    .unwrap();
    assert_eq!(m.member, member.pubkey(), "sponsor is not the member");
    assert_eq!(m.tier, 1);
    let after = env
        .svm
        .get_account(&sponsor.pubkey())
        .unwrap()
        .lamports;
    assert!(after < before, "sponsor paid the rent");
}

#[test]
fn join_after_deposits_close_reverts() {
    let (mut env, cfg) = setup_with_mutual(2);
    let (member, member_ata) = member_with(&mut env, 10_000_000);
    warp_clock(&mut env.svm, cfg.deposits_close_at);
    assert_custom_err(
        join_tx(&mut env, &cfg, &member, &member_ata, 0),
        hanse::HanseError::DepositsClosed,
    );
    // At the boundary minus one it passes.
    env.svm.expire_blockhash();
    warp_clock(&mut env.svm, cfg.deposits_close_at - 1);
    join_tx(&mut env, &cfg, &member, &member_ata, 0).unwrap();
}

#[test]
fn duplicate_join_reverts_same_or_other_tier() {
    let (mut env, cfg) = setup_with_mutual(3);
    let (member, member_ata) = member_with(&mut env, 50_000_000);
    join_tx(&mut env, &cfg, &member, &member_ata, 0).unwrap();

    // LiteSVM dedups identical transactions — rotate the blockhash so the
    // replayed join is a distinct tx (pool lifecycle.rs precedent).
    env.svm.expire_blockhash();
    let err = join_tx(&mut env, &cfg, &member, &member_ata, 0).unwrap_err();
    assert!(err.contains("already in use"), "same tier: {err}");
    env.svm.expire_blockhash();
    let err = join_tx(&mut env, &cfg, &member, &member_ata, 2).unwrap_err();
    assert!(err.contains("already in use"), "other tier: {err}");
}

#[test]
fn tier_out_of_range_reverts() {
    let (mut env, cfg) = setup_with_mutual(4);
    let (member, member_ata) = member_with(&mut env, 10_000_000);
    for bad in [3u8, 255] {
        assert_custom_err(
            join_tx(&mut env, &cfg, &member, &member_ata, bad),
            hanse::HanseError::TierInvalid,
        );
    }
}

#[test]
fn wrong_mint_ata_reverts() {
    let (mut env, cfg) = setup_with_mutual(5);
    let (member, _) = member_with(&mut env, 10_000_000);

    // A second, different mint and an ATA of it.
    let mint_kp = Keypair::new();
    send(
        &mut env.svm,
        &[
            create_account(
                &env.payer,
                &mint_kp,
                10_000_000_000,
                82,
                &spl_token_interface::ID,
            ),
            token_ix::initialize_mint2(
                &spl_token_interface::ID,
                &mint_kp.pubkey(),
                &env.payer.pubkey(),
                None,
                6,
            )
            .unwrap(),
        ],
        &mut [&env.payer, &mint_kp],
    );
    let wrong_ata = ata(&member.pubkey(), &mint_kp.pubkey());
    send(
        &mut env.svm,
        &[ata_ix::create_associated_token_account_idempotent(
            &env.payer.pubkey(),
            &member.pubkey(),
            &mint_kp.pubkey(),
            &spl_token_interface::ID,
        )],
        &mut [&env.payer],
    );

    // The pool CPI rejects the wrong-mint source ATA.
    assert!(join_tx(&mut env, &cfg, &member, &wrong_ata, 0).is_err());
}
