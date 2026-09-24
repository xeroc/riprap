//! attestation.rs — the §2.8 closed circle, proven end-to-end in LiteSVM
//! against the REAL programs (hanse + accord + SAS, no fabrication):
//!
//! - a joined member stakes into the mutual's credential-gated subaccord
//!   WITH their join-issued attestation → JurorStake credited (the member
//!   CAN judge).
//! - a wallet with no attestation (never joined) stakes → `AttestationMissing`
//!   (the outsider CANNOT judge — the whole point of riprap-7wa9).
//! - a wallet staking with SOMEONE ELSE's attestation → subject mismatch.
//!
//! MST plumbing mirrors accord's own attestation_litesvm.rs (leaf
use {
    anchor_lang::{
        solana_program::instruction::{AccountMeta, Instruction},
        InstructionData, ToAccountMetas,
    },
    common::*,
    solana_keypair::Keypair,
    solana_program::hash::hashv,
    solana_program::pubkey::Pubkey,
    solana_signer::Signer,
};

mod common;

/// AccordError 0-based index + 6000 (errors.rs order at the pinned rev):
/// AttestationMissing = 6057, AttestationSubjectMismatch = 6061.
const ERR_ATTESTATION_MISSING: &str = "6057";
const ERR_ATTESTATION_SUBJECT_MISMATCH: &str = "6061";

const STAKE_AMOUNT: u64 = 20_000_000; // §12: default juror stake = tier contribution

// ── MST helpers (accord utils.rs hashing, client-side) ──────────────────────

fn mst_leaf_hash(juror: &Pubkey, stake: u64) -> [u8; 32] {
    hashv(&[juror.as_ref(), &stake.to_le_bytes()]).to_bytes()
}

fn mst_node_hash(lh: &[u8; 32], ls: u64, rh: &[u8; 32], rs: u64) -> [u8; 32] {
    hashv(&[lh, &ls.to_le_bytes(), rh, &rs.to_le_bytes()]).to_bytes()
}

/// Path for `target` in a depth-`depth` tree whose only non-zero leaf is
/// `target` itself (first-stake shape).
fn first_leaf_path(
    juror: &Pubkey,
    stake: u64,
    target: u32,
    depth: u8,
) -> Vec<accord::state::MSTNode> {
    let empty = mst_leaf_hash(&Pubkey::default(), 0);
    let mut hashes = vec![empty; 1 << depth];
    let mut sums = vec![0u64; 1 << depth];
    hashes[target as usize] = mst_leaf_hash(juror, stake);
    sums[target as usize] = stake;
    let mut path = Vec::with_capacity(depth as usize);
    let mut idx = target as usize;
    for _ in 0..depth {
        let sib = if idx.is_multiple_of(2) { idx + 1 } else { idx - 1 };
        path.push(accord::state::MSTNode {
            sibling_hash: hashes[sib],
            sibling_sum: sums[sib],
        });
        let mut nh = Vec::with_capacity(hashes.len() / 2);
        let mut ns = Vec::with_capacity(sums.len() / 2);
        for k in (0..hashes.len()).step_by(2) {
            nh.push(mst_node_hash(&hashes[k], sums[k], &hashes[k + 1], sums[k + 1]));
            ns.push(sums[k] + sums[k + 1]);
        }
        hashes = nh;
        sums = ns;
        idx /= 2;
    }
    path
}

// ── stake tx ────────────────────────────────────────────────────────────────

fn subaccord_of(env: &Env, cfg: &hanse::instructions::InitializeMutualConfig) -> Pubkey {
    let domain_ref = hanse::instructions::subaccord_domain_ref(cfg.seed, &cfg.policy_hash);
    Pubkey::find_program_address(
        &[b"subaccord", env.payer.pubkey().as_ref(), domain_ref.as_ref()],
        &accord::id(),
    )
    .0
}

fn stake_ix(
    env: &Env,
    cfg: &hanse::instructions::InitializeMutualConfig,
    juror: &Keypair,
    amount: u64,
    path: Vec<accord::state::MSTNode>,
    attestation: Option<Pubkey>,
) -> Instruction {
    let subaccord = subaccord_of(env, cfg);
    let mut metas = accord::accounts::Stake {
        juror: juror.pubkey(),
        subaccord,
        accord_state: Pubkey::find_program_address(&[b"state"], &accord::id()).0,
        juror_stake: Pubkey::find_program_address(
            &[b"stake", subaccord.as_ref(), juror.pubkey().as_ref()],
            &accord::id(),
        )
        .0,
        staking_token: env.mint,
        juror_token_account: ata(&juror.pubkey(), &env.mint),
        stake_vault: ata(&subaccord, &env.mint),
        token_program: spl_token_interface::ID,
        associated_token_program: spl_associated_token_account_interface::program::ID,
        system_program: anchor_lang::solana_program::system_program::ID,
    }
    .to_account_metas(None);
    if let Some(att) = attestation {
        metas.push(AccountMeta::new_readonly(att, false));
    }
    Instruction::new_with_bytes(
        accord::id(),
        &accord::instruction::Stake { amount, path }.data(),
        metas,
    )
}

fn read_juror_stake(
    env: &Env,
    cfg: &hanse::instructions::InitializeMutualConfig,
    juror: &Pubkey,
) -> accord::state::JurorStake {
    let subaccord = subaccord_of(env, cfg);
    let pda = Pubkey::find_program_address(
        &[b"stake", subaccord.as_ref(), juror.as_ref()],
        &accord::id(),
    )
    .0;
    anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env.svm.get_account(&pda).unwrap().data[..],
    )
    .unwrap()
}

// ── the closed circle ───────────────────────────────────────────────────────

/// A joined member — holding the attestation `join` issued — stakes into the
/// mutual's credential-gated subaccord and is credited: members CAN judge.
#[test]
fn member_stakes_with_join_attestation() {
    let (mut env, cfg) = setup_with_mutual(7);
    init_accord_state(&mut env);
    let (member, member_ata) = member_with(&mut env, 20_000_000 + STAKE_AMOUNT);
    join_member(&mut env, &cfg, &member, &member_ata, 1).unwrap();

    let mutual = mutual_pda(7);
    let credential = hanse::sas::credential_pda(&mutual);
    let schema = hanse::sas::schema_pda(&credential);
    let attestation = hanse::sas::attestation_pda(&credential, &schema, &member.pubkey());

    let path = first_leaf_path(&member.pubkey(), STAKE_AMOUNT, 0, 12);
    let ix = stake_ix(&env, &cfg, &member, STAKE_AMOUNT, path, Some(attestation));
    try_send(&mut env.svm, &[ix], &mut [&member]).unwrap();

    let js = read_juror_stake(&env, &cfg, &member.pubkey());
    assert_eq!(js.staked, STAKE_AMOUNT, "member's stake credited");
    assert_eq!(js.tree_index, 0, "first leaf");
    assert_eq!(js.active_draws, 0);
}

/// A wallet that never joined has no attestation — the gated subaccord
/// rejects its stake: outsiders CANNOT judge. This is the riprap-7wa9 payoff.
#[test]
fn non_member_stake_reverts_attestation_missing() {
    let (mut env, cfg) = setup_with_mutual(8);
    init_accord_state(&mut env);
    let (outsider, _ata) = member_with(&mut env, STAKE_AMOUNT); // funded, but never joined

    let path = first_leaf_path(&outsider.pubkey(), STAKE_AMOUNT, 0, 12);
    let ix = stake_ix(&env, &cfg, &outsider, STAKE_AMOUNT, path, None);
    let err = try_send(&mut env.svm, &[ix], &mut [&outsider]).unwrap_err();
    assert!(
        err.contains(ERR_ATTESTATION_MISSING),
        "AttestationMissing (6057): {err}"
    );
    // And no stake account materialized for the outsider.
    let subaccord = subaccord_of(&env, &cfg);
    let js_pda = Pubkey::find_program_address(
        &[b"stake", subaccord.as_ref(), outsider.pubkey().as_ref()],
        &accord::id(),
    )
    .0;
    assert!(env.svm.get_account(&js_pda).is_none());
}

/// Presenting another member's attestation does not pass either — the gate
/// binds the attestation's subject (`data[0..32]`) to the staker's wallet.
#[test]
fn stolen_attestation_reverts_subject_mismatch() {
    let (mut env, cfg) = setup_with_mutual(9);
    init_accord_state(&mut env);
    let (member, member_ata) = member_with(&mut env, 20_000_000);
    join_member(&mut env, &cfg, &member, &member_ata, 1).unwrap();
    let (thief, _thief_ata) = member_with(&mut env, STAKE_AMOUNT); // never joined

    let mutual = mutual_pda(9);
    let credential = hanse::sas::credential_pda(&mutual);
    let schema = hanse::sas::schema_pda(&credential);
    let members_attestation = hanse::sas::attestation_pda(&credential, &schema, &member.pubkey());

    let path = first_leaf_path(&thief.pubkey(), STAKE_AMOUNT, 0, 12);
    let ix = stake_ix(
        &env,
        &cfg,
        &thief,
        STAKE_AMOUNT,
        path,
        Some(members_attestation),
    );
    let err = try_send(&mut env.svm, &[ix], &mut [&thief]).unwrap_err();
    assert!(
        err.contains(ERR_ATTESTATION_SUBJECT_MISMATCH),
        "AttestationSubjectMismatch (6061): {err}"
    );
}
