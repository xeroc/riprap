//! Hanse security matrix (LiteSVM) — bean riprap-pow4. Systematic negative
//! suite across every instruction; safe-solana-builder checklist categories
//! cited per row. Every case asserts the typed error (ours) or the precise
//! anchor constraint error — never a generic panic.
//!
//! | Row | Case | Expected |
//! |-----|------|----------|
//! | S1  | claim_payout without authority co-sign (broken auth) | Unauthorized |
//! | S2  | set_subaccord_param by non-admin (broken auth) | Unauthorized |
//! | S3  | file_claim: claimant ≠ the member PDA's member (signer chain) | ConstraintSeeds (the seeds bind member to claimant) |
//! | S4  | join with another mutual's pool (cross-mutual) | WrongPool |
//! | S5  | file_claim with another mutual's subaccord (cross-mutual) | WrongSubaccord |
//! | S6  | file_claim with another mutual's member PDA (cross-mutual) | ConstraintSeeds (anchor) |
//! | S7  | settle_claim with another mutual's claim (cross-mutual) | NotMember (claim.mutual) |
//! | S8  | claim_payout with another mutual's claim (cross-mutual) | NotMember (claim.mutual) |
//! | S9  | Mutual re-init (same seed) | already in use (anchor init) |
//! | S10 | Member re-init (duplicate join) | already in use (anchor init) |
//! | S11 | Claim re-init (consumed nonce) | already in use (claim PDA init) |
//! | S12 | ratio 0 (drained treasury): payout floors to 0 | Paid, paid = 0 |
//! | S13 | file_claim requested = 0 (bad input) | InvalidClaimAmount |
//! | S14 | settle_claim on non-terminal dispute (stale CPI state) | DisputeNotFinal |
//! | S15 | claim_payout before settle_pool (stale CPI state) | NotSettled |
//! | S16 | payout u128 overflow guard (arithmetic edge) | unreachable by construction: u64 × 1e9 ≈ 1.8e28 < u128::MAX ≈ 3.4e38; guards stay defensive |

mod common;

use {
    anchor_lang::{solana_program::pubkey::Pubkey, InstructionData, ToAccountMetas},
    common::*,
    solana_account::Account,
    solana_keypair::Keypair,
    solana_signer::Signer,
    spl_token_interface::state::Account as TokenAccountState,
};

const CLAIM: u64 = 2_000_000_000;

/// Two mutuals in one world: seed 1 (every attack's target) and seed 2 (the
/// foreign source of pool/subaccord/member accounts).
fn setup_two_mutuals() -> (
    Env,
    hanse::instructions::InitializeMutualConfig,
    hanse::instructions::InitializeMutualConfig,
    Keypair,
) {
    let (mut env, cfg1) = setup_with_mutual(1);
    init_accord_state(&mut env);
    arm_subaccord(&mut env, &cfg1, 3);
    let cfg2 = default_config(2);
    init_mutual(&mut env, &cfg2).unwrap();
    let (member, member_ata) = member_with(&mut env, 3_000_000_000);
    join_member(&mut env, &cfg1, &member, &member_ata, 1).unwrap();
    env.svm.expire_blockhash();
    (env, cfg1, cfg2, member)
}

fn subaccord_of(env: &Env, cfg: &hanse::instructions::InitializeMutualConfig) -> Pubkey {
    let domain_ref = hanse::instructions::subaccord_domain_ref(cfg.seed, &cfg.policy_hash);
    Pubkey::find_program_address(
        &[
            b"subaccord",
            env.payer.pubkey().as_ref(),
            domain_ref.as_ref(),
        ],
        &accord::id(),
    )
    .0
}

// ── tx builders (attack-shaped) ────────────────────────────────────────────

struct FileClaimAttack {
    subaccord: Option<Pubkey>,
    member_account: Option<Pubkey>,
    nonce: Option<u64>,
    requested: u64,
}

fn file_claim_attacked(
    env: &mut Env,
    cfg: &hanse::instructions::InitializeMutualConfig,
    signer: &Keypair,
    attack: FileClaimAttack,
) -> Result<(), String> {
    let mutual = mutual_pda(cfg.seed);
    let m: hanse::Mutual = anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env.svm.get_account(&mutual).unwrap().data[..],
    )
    .unwrap();
    let nonce = attack.nonce.unwrap_or(m.claim_nonce);
    let pool = pool_pda(cfg.seed);
    let dispute = Pubkey::find_program_address(
        &[b"dispute", mutual.as_ref(), nonce.to_le_bytes().as_ref()],
        &accord::id(),
    )
    .0;
    let subaccord = attack.subaccord.unwrap_or_else(|| subaccord_of(env, cfg));
    let member_account = attack
        .member_account
        .unwrap_or_else(|| member_pda(&mutual, &signer.pubkey()));
    let ix = anchor_lang::solana_program::instruction::Instruction::new_with_bytes(
        hanse::id(),
        &hanse::instruction::FileClaim {
            requested: attack.requested,
            evidence_hash: [1; 32],
            nonce,
        }
        .data(),
        hanse::accounts::FileClaim {
            claimant: signer.pubkey(),
            mutual,
            member_account,
            claim: claim_pda(&mutual, nonce),
            depositor: pool_depositor(&pool, &signer.pubkey()),
            subaccord,
            member_fee_ata: ata(&signer.pubkey(), &env.mint),
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
    try_send(&mut env.svm, &[ix], &mut [signer])
}

fn payout_attacked(
    env: &mut Env,
    cfg: &hanse::instructions::InitializeMutualConfig,
    claimant: &Keypair,
    authority: &Keypair,
    mutual_addr: Pubkey,
    claim_addr: Pubkey,
) -> Result<(), String> {
    let pool = pool_pda(cfg.seed);
    let c: hanse::Claim = anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env.svm.get_account(&claim_addr).unwrap().data[..],
    )
    .unwrap();
    let ix = anchor_lang::solana_program::instruction::Instruction::new_with_bytes(
        hanse::id(),
        &hanse::instruction::ClaimPayout {}.data(),
        hanse::accounts::ClaimPayout {
            claimant: claimant.pubkey(),
            authority: authority.pubkey(),
            rights_authority: mutual_auth_pda(&mutual_addr),
            mutual: mutual_addr,
            claim: claim_addr,
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
    try_send(&mut env.svm, &[ix], &mut [claimant, authority])
}

fn settle_claim_attacked(env: &mut Env, mutual_addr: Pubkey, claim_addr: Pubkey) -> Result<(), String> {
    let crank = cranker(env);
    let c: hanse::Claim = anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env.svm.get_account(&claim_addr).unwrap().data[..],
    )
    .unwrap();
    let ix = anchor_lang::solana_program::instruction::Instruction::new_with_bytes(
        hanse::id(),
        &hanse::instruction::SettleClaim {}.data(),
        hanse::accounts::SettleClaim {
            cranker: crank.pubkey(),
            mutual: mutual_addr,
            claim: claim_addr,
            member_account: member_pda(&mutual_addr, &c.member),
            dispute: c.dispute,
            fee_float: ata(&mutual_addr, &env.mint),
            claimant_ata: ata(&c.member, &env.mint),
            fee_mint: env.mint,
            token_program: spl_token_interface::ID,
        }
        .to_account_metas(None),
    );
    try_send(&mut env.svm, &[ix], &mut [&crank])
}

fn settle_pool_now(env: &mut Env, cfg: &hanse::instructions::InitializeMutualConfig) {
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
    try_send(&mut env.svm, &[ix], &mut [&crank]).unwrap();
}

/// Overwrite a token account's amount (test-only state fabrication).
fn set_token_amount(env: &mut Env, address: &Pubkey, amount: u64) {
    use solana_program_pack::Pack;
    let acc = env.svm.get_account(address).unwrap();
    let mut ta = TokenAccountState::unpack(&acc.data).unwrap();
    ta.amount = amount;
    let mut data = vec![0u8; TokenAccountState::LEN];
    TokenAccountState::pack(ta, &mut data).unwrap();
    env.svm
        .set_account(
            *address,
            Account {
                lamports: acc.lamports,
                data,
                owner: spl_token_interface::ID,
                executable: false,
                rent_epoch: 0,
            },
        )
        .unwrap();
}

/// Settle one approved claim at `nonce` through the real instructions.
fn approve_and_settle(
    env: &mut Env,
    cfg: &hanse::instructions::InitializeMutualConfig,
    nonce: u64,
) {
    let mutual = mutual_pda(cfg.seed);
    force_final(&mut env.svm, &dispute_pda(&mutual, nonce), 0);
    let crank = cranker(env);
    settle_claim_raw(env, cfg, &crank, nonce).unwrap();
    env.svm.expire_blockhash();
}

// ── rows ───────────────────────────────────────────────────────────────────

/// S1 — broken auth: payout without the pass co-signature.
#[test]
fn s1_payout_without_cosign() {
    let (mut env, cfg) = setup_with_mutual(1);
    init_accord_state(&mut env);
    arm_subaccord(&mut env, &cfg, 3);
    let (m, ata_addr) = member_with(&mut env, 3_000_000_000);
    join_member(&mut env, &cfg, &m, &ata_addr, 1).unwrap();
    env.svm.expire_blockhash();
    file_claim_raw(&mut env, &cfg, &m, CLAIM).unwrap();
    approve_and_settle(&mut env, &cfg, 0);
    warp_clock(&mut env.svm, cfg.claims_close_at);
    settle_pool_now(&mut env, &cfg);

    let impostor = cranker(&mut env);
    assert_custom_err(
        payout_attacked(
            &mut env,
            &cfg,
            &m,
            &impostor,
            mutual_pda(1),
            claim_pda(&mutual_pda(1), 0),
        ),
        hanse::HanseError::Unauthorized,
    );
}

/// S2 — broken auth: the param lever by a stranger.
#[test]
fn s2_param_by_non_admin() {
    let (mut env, cfg, _cfg2, _m) = setup_two_mutuals();
    let stranger = cranker(&mut env);
    let subaccord = subaccord_of(&env, &cfg);
    let pending = Pubkey::find_program_address(
        &[b"update", subaccord.as_ref(), 0u64.to_le_bytes().as_ref()],
        &accord::id(),
    )
    .0;
    let ix = anchor_lang::solana_program::instruction::Instruction::new_with_bytes(
        hanse::id(),
        &hanse::instruction::SetSubaccordParam {
            nonce: 0,
            param: hanse::instructions::SubaccordParam::MinStake(1),
        }
        .data(),
        hanse::accounts::SetSubaccordParam {
            authority: stranger.pubkey(),
            rent_payer: stranger.pubkey(),
            mutual: mutual_pda(cfg.seed),
            subaccord,
            pending_update: pending,
            system_program: anchor_lang::solana_program::system_program::ID,
            accord_program: accord::id(),
        }
        .to_account_metas(None),
    );
    let err = try_send(&mut env.svm, &[ix], &mut [&stranger]);
    assert_custom_err(err, hanse::HanseError::Unauthorized);
}

/// S3 — signer chain: the claimant signs, but the member PDA is someone
/// else's.
#[test]
fn s3_file_claim_signer_chain() {
    let (mut env, cfg, _cfg2, member) = setup_two_mutuals();
    let (other, oata) = member_with(&mut env, 3_000_000_000);
    join_member(&mut env, &cfg, &other, &oata, 0).unwrap();
    env.svm.expire_blockhash();
    let err = file_claim_attacked(
        &mut env,
        &cfg,
        &member,
        FileClaimAttack {
            member_account: Some(member_pda(&mutual_pda(cfg.seed), &other.pubkey())),
            ..Default::default()
        },
    )
    .unwrap_err();
    assert!(
        err.contains("ConstraintSeeds"),
        "the member PDA is seed-bound to its own member: {err}"
    );
}

impl Default for FileClaimAttack {
    fn default() -> Self {
        Self {
            subaccord: None,
            member_account: None,
            nonce: None,
            requested: 100,
        }
    }
}

/// S4 — cross-mutual: joining mutual 1 while passing mutual 2's pool.
#[test]
fn s4_join_with_foreign_pool() {
    let (mut env, cfg1, cfg2, _m) = setup_two_mutuals();
    let (m2, ata2) = member_with(&mut env, 3_000_000_000);
    let ix = anchor_lang::solana_program::instruction::Instruction::new_with_bytes(
        hanse::id(),
        &hanse::instruction::Join { tier: 0 }.data(),
        hanse::accounts::Join {
            member: m2.pubkey(),
            member_account: member_pda(&mutual_pda(cfg1.seed), &m2.pubkey()),
            mutual: mutual_pda(cfg1.seed),
            pool: pool_pda(cfg2.seed),
            depositor: pool_depositor(&pool_pda(cfg2.seed), &m2.pubkey()),
            owner_ata: ata2,
            rent_payer: m2.pubkey(),
            treasury: pool_treasury(&pool_pda(cfg2.seed), &env.mint),
            deposit_mint: env.mint,
            token_program: spl_token_interface::ID,
            system_program: anchor_lang::solana_program::system_program::ID,
            pool_program: pool::id(),
        }
        .to_account_metas(None),
    );
    assert_custom_err(
        try_send(&mut env.svm, &[ix], &mut [&m2]),
        hanse::HanseError::WrongPool,
    );
}

/// S5 — cross-mutual: filing against mutual 1 with mutual 2's subaccord.
#[test]
fn s5_file_claim_foreign_subaccord() {
    let (mut env, cfg1, cfg2, member) = setup_two_mutuals();
    let foreign_subaccord = subaccord_of(&env, &cfg2);
    assert_custom_err(
        file_claim_attacked(
            &mut env,
            &cfg1,
            &member,
            FileClaimAttack {
                subaccord: Some(foreign_subaccord),
                ..Default::default()
            },
        ),
        hanse::HanseError::WrongSubaccord,
    );
}

/// S6 — cross-mutual: mutual 2's member PDA in a mutual-1 filing — the seeds
/// constraint rejects it before any handler code runs.
#[test]
fn s6_file_claim_foreign_member_pda() {
    let (mut env, cfg1, cfg2, member) = setup_two_mutuals();
    let member_ata = ata(&member.pubkey(), &env.mint);
    join_member(&mut env, &cfg2, &member, &member_ata, 1).unwrap();
    env.svm.expire_blockhash();
    let foreign_member = member_pda(&mutual_pda(cfg2.seed), &member.pubkey());
    let err = file_claim_attacked(
        &mut env,
        &cfg1,
        &member,
        FileClaimAttack {
            member_account: Some(foreign_member),
            ..Default::default()
        },
    )
    .unwrap_err();
    assert!(
        err.contains("ConstraintSeeds"),
        "anchor seeds constraint fires for a foreign member PDA: {err}"
    );
}

/// S7 — cross-mutual: settling mutual 1's claim inside mutual 2's context.
#[test]
fn s7_settle_claim_foreign_claim() {
    let (mut env, cfg1, cfg2, member) = setup_two_mutuals();
    let member_ata = ata(&member.pubkey(), &env.mint);
    join_member(&mut env, &cfg2, &member, &member_ata, 1).unwrap();
    env.svm.expire_blockhash();
    file_claim_raw(&mut env, &cfg1, &member, CLAIM).unwrap();
    assert_custom_err(
        settle_claim_attacked(
        &mut env, mutual_pda(2), claim_pda(&mutual_pda(1), 0)),
        hanse::HanseError::NotMember,
    );
}

/// S8 — cross-mutual: pulling mutual 1's approved claim via mutual 2.
#[test]
fn s8_payout_foreign_claim() {
    let (mut env, cfg1, cfg2, member) = setup_two_mutuals();
    file_claim_raw(&mut env, &cfg1, &member, CLAIM).unwrap();
    approve_and_settle(&mut env, &cfg1, 0);
    // Settle BOTH mutuals so mutual 2's phase gate passes and the cross-claim
    // binding is what rejects.
    warp_clock(&mut env.svm, cfg1.claims_close_at.max(cfg2.claims_close_at));
    settle_pool_now(&mut env, &cfg1);
    settle_pool_now(&mut env, &cfg2);
    let admin = Keypair::try_from(&env.payer.to_bytes()[..]).unwrap();
    assert_custom_err(
        payout_attacked(
            &mut env,
            &cfg1,
            &member,
            &admin,
            mutual_pda(2),
            claim_pda(&mutual_pda(1), 0),
        ),
        hanse::HanseError::NotMember,
    );
}

/// S9 — Mutual re-initialization at the same seed.
#[test]
fn s9_mutual_reinit() {
    let (mut env, cfg, _cfg2, _m) = setup_two_mutuals();
    env.svm.expire_blockhash();
    let err = init_mutual(&mut env, &cfg).unwrap_err();
    assert!(err.contains("already in use"), "PDA init guard: {err}");
}

/// S10 — duplicate join (Member re-init), same or other tier.
#[test]
fn s10_member_reinit() {
    let (mut env, cfg, _cfg2, member) = setup_two_mutuals();
    let ata_addr = ata(&member.pubkey(), &env.mint);
    env.svm.expire_blockhash();
    let err = join_member(&mut env, &cfg, &member, &ata_addr, 2).unwrap_err();
    assert!(
        err.contains("already in use"),
        "one member account per member: {err}"
    );
}

/// S11 — re-filing at the consumed nonce 0 after claim_nonce advanced.
#[test]
fn s11_claim_reinit_consumed_nonce() {
    let (mut env, cfg, _cfg2, member) = setup_two_mutuals();
    file_claim_raw(&mut env, &cfg, &member, CLAIM).unwrap();
    env.svm.expire_blockhash();
    let err = file_claim_attacked(
        &mut env,
        &cfg,
        &member,
        FileClaimAttack {
            nonce: Some(0),
            requested: 100,
            ..Default::default()
        },
    )
    .unwrap_err();
    assert!(err.contains("already in use"), "claim PDA guard: {err}");
}

/// S12 — arithmetic edge: drained treasury → ratio 0 → payout floors to
/// zero; the claim still flips Paid (idempotence holds) and burns nothing.
#[test]
fn s12_ratio_zero_pays_nothing() {
    let (mut env, cfg) = setup_with_mutual(1);
    init_accord_state(&mut env);
    arm_subaccord(&mut env, &cfg, 3);
    let (m, ata_addr) = member_with(&mut env, 3_000_000_000);
    join_member(&mut env, &cfg, &m, &ata_addr, 1).unwrap();
    env.svm.expire_blockhash();
    file_claim_raw(&mut env, &cfg, &m, CLAIM).unwrap();
    approve_and_settle(&mut env, &cfg, 0);
    // Drain the treasury before settlement (fabricated — models total loss).
    let mint = env.mint;
    set_token_amount(&mut env, &pool_treasury(&pool_pda(1), &mint), 0);
    warp_clock(&mut env.svm, cfg.claims_close_at);
    settle_pool_now(&mut env, &cfg);

    let mt: hanse::Mutual = anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env.svm.get_account(&mutual_pda(1)).unwrap().data[..],
    )
    .unwrap();
    assert_eq!(mt.ratio_1e9, 0, "0 × 1e9 / obligations = 0");

    let admin = Keypair::try_from(&env.payer.to_bytes()[..]).unwrap();
    let before = token_amount(&env.svm, &ata_addr);
    payout_attacked(
        &mut env,
        &cfg,
        &m,
        &admin,
        mutual_pda(1),
        claim_pda(&mutual_pda(1), 0),
    )
    .unwrap();
    assert_eq!(
        token_amount(&env.svm, &ata_addr),
        before,
        "payout floors to 0"
    );
    let c: hanse::Claim = anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env
            .svm
            .get_account(&claim_pda(&mutual_pda(1), 0))
            .unwrap()
            .data[..],
    )
    .unwrap();
    assert_eq!(c.status, hanse::state::ClaimStatus::Paid);
}

/// S13 — bad input: a zero claim request.
#[test]
fn s13_zero_requested_reverts() {
    let (mut env, cfg, _cfg2, member) = setup_two_mutuals();
    assert_custom_err(
        file_claim_attacked(
            &mut env,
            &cfg,
            &member,
            FileClaimAttack {
                requested: 0,
                ..Default::default()
            },
        ),
        hanse::HanseError::InvalidClaimAmount,
    );
}

/// S14 — stale CPI state: settling while the dispute is still live.
#[test]
fn s14_settle_claim_non_terminal() {
    let (mut env, cfg, _cfg2, member) = setup_two_mutuals();
    file_claim_raw(&mut env, &cfg, &member, CLAIM).unwrap();
    assert_custom_err(
        settle_claim_attacked(
        &mut env, mutual_pda(1), claim_pda(&mutual_pda(1), 0)),
        hanse::HanseError::DisputeNotFinal,
    );
}

/// S15 — stale CPI state: pulling before settle_pool froze the ratio.
#[test]
fn s15_payout_before_settlement() {
    let (mut env, cfg, _cfg2, member) = setup_two_mutuals();
    file_claim_raw(&mut env, &cfg, &member, CLAIM).unwrap();
    approve_and_settle(&mut env, &cfg, 0);
    let admin = Keypair::try_from(&env.payer.to_bytes()[..]).unwrap();
    assert_custom_err(
        payout_attacked(
            &mut env,
            &cfg,
            &member,
            &admin,
            mutual_pda(1),
            claim_pda(&mutual_pda(1), 0),
        ),
        hanse::HanseError::NotSettled,
    );
}
