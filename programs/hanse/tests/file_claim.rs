//! file_claim tests (EVENT-MUTUAL §2.3/§2.6/§7, bean riprap-ihyo): one claim
//! per member, tier-clamped, claimant-funded fee, dispute filed by the mutual.

mod common;

use {
    anchor_lang::{solana_program::pubkey::Pubkey, InstructionData, ToAccountMetas},
    common::*,
    solana_keypair::Keypair,
    solana_signer::Signer,
};

const FEE: u64 = 3 * 1_000_000; // min_jury_size 3 × fee_per_juror 1_000_000

fn file_claim_tx(
    env: &mut Env,
    cfg: &hanse::instructions::InitializeMutualConfig,
    member: &Keypair,
    requested: u64,
    evidence_hash: [u8; 32],
    nonce: u64,
) -> Result<(), String> {
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
    let dispute = Pubkey::find_program_address(
        &[b"dispute", mutual.as_ref(), nonce.to_le_bytes().as_ref()],
        &accord::id(),
    )
    .0;
    let ix = Instruction::new_with_bytes(
        hanse::id(),
        &hanse::instruction::FileClaim {
            requested,
            evidence_hash,
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

fn setup_claimable(
    tier: u8,
    balance: u64,
) -> (
    Env,
    hanse::instructions::InitializeMutualConfig,
    Keypair,
    anchor_lang::prelude::Pubkey,
) {
    let (mut env, cfg) = setup_with_mutual(1);
    init_accord_state(&mut env);
    let (member, member_ata) = member_with(&mut env, balance);
    join_member(&mut env, &cfg, &member, &member_ata, tier).unwrap();
    arm_subaccord(&mut env, &cfg, 3);
    (env, cfg, member, member_ata)
}

/// §7 happy path: claim Pending, fee moved member → float → fee vault,
/// counters and has_pending flipped, dispute bound to mutual + nonce.
#[test]
fn file_claim_opens_dispute_and_marks_pending() {
    let (mut env, cfg, member, member_ata) = setup_claimable(1, 50_000_000);

    file_claim_tx(&mut env, &cfg, &member, 1_500_000_000, [9u8; 32], 0).unwrap();

    let mutual = mutual_pda(1);
    let claim_addr = claim_pda(&mutual, 0);
    let c: hanse::Claim = anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env.svm.get_account(&claim_addr).unwrap().data[..],
    )
    .unwrap();
    assert_eq!(
        c.claim_amount, 1_500_000_000,
        "under the tier cap: not clamped"
    );
    assert_eq!(c.status, hanse::state::ClaimStatus::Pending);
    assert_eq!(c.fee_paid, FEE);
    assert_eq!(c.member, member.pubkey());
    assert_eq!(c.settled_at, 0);

    // Dispute: bound to this mutual + nonce, filed by the mutual PDA, binary
    // options, evidence hash passed through verbatim (no wrap).
    let dispute = dispute_pda(&mutual, 0);
    assert_eq!(c.dispute, dispute);
    let (d, _): (accord::state::Dispute, u64) = {
        let acc = env.svm.get_account(&dispute).unwrap();
        (
            anchor_lang::AccountDeserialize::try_deserialize(&mut &acc.data[..]).unwrap(),
            acc.lamports,
        )
    };
    assert_eq!(d.filer, mutual, "the mutual PDA files, not the member");
    assert_eq!(d.nonce, 0);
    assert_eq!(d.num_options, 2);
    assert_eq!(d.evidence_hashes[0], [9u8; 32]);
    assert_eq!(
        d.options[0],
        hanse::instructions::option_label(&mutual, 0),
        "Approve = index 0 (TS e2e contract)"
    );
    assert_eq!(d.options[1], hanse::instructions::option_label(&mutual, 1));

    // Fee: exactly min_jury_size × fee_per_juror, member → float → vault.
    assert_eq!(
        token_amount(&env.svm, &member_ata),
        50_000_000 - 20_000_000 - FEE
    );
    assert_eq!(
        token_amount(&env.svm, &ata(&mutual, &env.mint)),
        0,
        "float drained by the CPI"
    );
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
    assert_eq!(token_amount(&env.svm, &ata(&subaccord, &env.mint)), FEE);

    // Mutual + member bookkeeping.
    let m: hanse::Mutual = anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env.svm.get_account(&mutual).unwrap().data[..],
    )
    .unwrap();
    assert_eq!((m.claims_filed, m.claim_nonce), (1, 1));
    let mem: hanse::Member = anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env
            .svm
            .get_account(&member_pda(&mutual, &member.pubkey()))
            .unwrap()
            .data[..],
    )
    .unwrap();
    assert!(mem.has_pending_claim);
}

#[test]
fn claim_amount_clamps_at_tier_cap() {
    // Tier 0 caps at 1_000_000_000 — request more, get the cap (§2.3).
    let (mut env, cfg, member, _) = setup_claimable(0, 20_000_000);
    file_claim_tx(&mut env, &cfg, &member, 5_000_000_000, [1u8; 32], 0).unwrap();
    let c: hanse::Claim = anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env
            .svm
            .get_account(&claim_pda(&mutual_pda(1), 0))
            .unwrap()
            .data[..],
    )
    .unwrap();
    assert_eq!(
        c.claim_amount, 1_000_000_000,
        "clamp = tiers[tier].max_payout"
    );
}

#[test]
fn second_pending_claim_reverts() {
    let (mut env, cfg, member, _) = setup_claimable(1, 50_000_000);
    file_claim_tx(&mut env, &cfg, &member, 100, [1u8; 32], 0).unwrap();
    env.svm.expire_blockhash();
    assert_custom_err(
        file_claim_tx(&mut env, &cfg, &member, 100, [2u8; 32], 1),
        hanse::HanseError::PendingClaimExists,
    );
}

#[test]
fn late_filing_reverts() {
    let (mut env, cfg, member, _) = setup_claimable(1, 50_000_000);
    warp_clock(&mut env.svm, cfg.claims_close_at);
    assert_custom_err(
        file_claim_tx(&mut env, &cfg, &member, 100, [1u8; 32], 0),
        hanse::HanseError::ClaimsClosed,
    );
    warp_clock(&mut env.svm, cfg.claims_close_at - 1);
    env.svm.expire_blockhash();
    file_claim_tx(&mut env, &cfg, &member, 100, [1u8; 32], 0).unwrap();
}

#[test]
fn non_member_reverts() {
    let (mut env, cfg, _member, _) = setup_claimable(1, 50_000_000);
    // A wallet with money but no membership (no Member PDA — init in the ix
    // will create one, but the member_pda seeds point at a stranger).
    let (stranger, stranger_ata) = member_with(&mut env, 10_000_000);
    let _ = stranger_ata;
    // The member_account passed belongs to the real member → NotMember.
    let err = {
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
        let dispute = Pubkey::find_program_address(
            &[b"dispute", mutual.as_ref(), 0u64.to_le_bytes().as_ref()],
            &accord::id(),
        )
        .0;
        let (real_member, _) = member_with(&mut env, 10_000_000);
        let ix = Instruction::new_with_bytes(
            hanse::id(),
            &hanse::instruction::FileClaim {
                requested: 100,
                evidence_hash: [1; 32],
                nonce: 0,
            }
            .data(),
            hanse::accounts::FileClaim {
                claimant: stranger.pubkey(),
                rent_payer: stranger.pubkey(),
                mutual,
                member_account: member_pda(&mutual, &real_member.pubkey()),
                claim: claim_pda(&mutual, 0),
                depositor: pool_depositor(&pool, &stranger.pubkey()),
                subaccord,
                member_fee_ata: ata(&stranger.pubkey(), &env.mint),
                fee_float: ata(&mutual, &env.mint),
                fee_mint: env.mint,
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
        try_send(&mut env.svm, &[ix], &mut [&stranger])
    };
    // Anchor rejects the uninitialized Member PDA (AccountNotInitialized) —
    // the typed NotMember fires for a real Member of ANOTHER mutual.
    let msg = err.unwrap_err();
    assert!(
        msg.contains("AccountNotInitialized"),
        "stranger has no Member account: {msg}"
    );
}

#[test]
fn zero_rights_stake_reverts() {
    let (mut env, cfg, member, _) = setup_claimable(1, 50_000_000);
    // Fabricate the burn-out state: rights_stake = 0 on the real depositor.
    let depositor = pool_depositor(&pool_pda(1), &member.pubkey());
    let acc = env.svm.get_account(&depositor).unwrap();
    let mut d: pool::Depositor =
        anchor_lang::AccountDeserialize::try_deserialize(&mut &acc.data[..]).unwrap();
    d.rights_stake = 0;
    let mut data = acc.data[..8].to_vec();
    ::borsh::BorshSerialize::serialize(&d, &mut data).unwrap();
    env.svm
        .set_account(
            depositor,
            solana_account::Account {
                lamports: acc.lamports,
                data,
                owner: pool::id(),
                executable: false,
                rent_epoch: 0,
            },
        )
        .unwrap();

    assert_custom_err(
        file_claim_tx(&mut env, &cfg, &member, 100, [1u8; 32], 0),
        hanse::HanseError::NoRightsStake,
    );
}

#[test]
fn nonce_mismatch_reverts() {
    let (mut env, cfg, member, _) = setup_claimable(1, 50_000_000);
    assert_custom_err(
        file_claim_tx(&mut env, &cfg, &member, 100, [1u8; 32], 7),
        hanse::HanseError::NonceMismatch,
    );
}
