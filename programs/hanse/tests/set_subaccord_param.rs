//! set_subaccord_param tests (EVENT-MUTUAL §2.10/§7, bean riprap-xfqj): the
//! demo admin lever through accord's 48h timelock.

mod common;

use {
    anchor_lang::{solana_program::pubkey::Pubkey, InstructionData, ToAccountMetas},
    common::*,
    solana_keypair::Keypair,
    solana_signer::Signer,
};

fn param_tx(
    env: &mut Env,
    cfg: &hanse::instructions::InitializeMutualConfig,
    signer: &Keypair,
    nonce: u64,
    param: hanse::instructions::SubaccordParam,
) -> Result<(), String> {
    use anchor_lang::solana_program::instruction::Instruction;
    let mutual = mutual_pda(cfg.seed);
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
    let pending = Pubkey::find_program_address(
        &[b"update", subaccord.as_ref(), nonce.to_le_bytes().as_ref()],
        &accord::id(),
    )
    .0;
    let ix = Instruction::new_with_bytes(
        hanse::id(),
        &hanse::instruction::SetSubaccordParam { nonce, param }.data(),
        hanse::accounts::SetSubaccordParam {
            authority: signer.pubkey(),
            rent_payer: signer.pubkey(),
            mutual,
            subaccord,
            pending_update: pending,
            system_program: anchor_lang::solana_program::system_program::ID,
            accord_program: accord::id(),
        }
        .to_account_metas(None),
    );
    try_send(&mut env.svm, &[ix], &mut [signer])
}

fn execute_update_tx(
    env: &mut Env,
    cfg: &hanse::instructions::InitializeMutualConfig,
    caller: &Keypair,
    nonce: u64,
) -> Result<(), String> {
    use anchor_lang::solana_program::instruction::Instruction;
    let subaccord = subacc(env, cfg);
    let pending = Pubkey::find_program_address(
        &[b"update", subaccord.as_ref(), nonce.to_le_bytes().as_ref()],
        &accord::id(),
    )
    .0;
    let ix = Instruction::new_with_bytes(
        accord::id(),
        &accord::instruction::ExecuteSubaccordUpdate {}.data(),
        accord::accounts::ExecuteSubaccordUpdate {
            caller: caller.pubkey(),
            subaccord,
            pending_update: pending,
        }
        .to_account_metas(None),
    );
    try_send(&mut env.svm, &[ix], &mut [caller])
}

fn subacc(env: &Env, cfg: &hanse::instructions::InitializeMutualConfig) -> Pubkey {
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

fn read_pending(env: &Env, subaccord: &Pubkey, nonce: u64) -> accord::state::PendingUpdate {
    let pending = Pubkey::find_program_address(
        &[b"update", subaccord.as_ref(), nonce.to_le_bytes().as_ref()],
        &accord::id(),
    )
    .0;
    anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env.svm.get_account(&pending).unwrap().data[..],
    )
    .unwrap()
}

/// An independent copy of the mutual's initializer keys (the admin).
fn admin(env: &Env) -> Keypair {
    Keypair::try_from(&env.payer.to_bytes()[..]).unwrap()
}

#[test]
fn proposal_lands_with_exact_payload() {
    let (mut env, cfg) = setup_with_mutual(1);
    let slot = env.svm.get_sysvar::<solana_clock::Clock>().slot;

    let admin = admin(&env);
    param_tx(
        &mut env,
        &cfg,
        &admin,
        0,
        hanse::instructions::SubaccordParam::MinStake(25_000_000),
    )
    .unwrap();

    let pu = read_pending(&env, &subacc(&env, &cfg), 0);
    assert_eq!(
        pu.proposed,
        accord::state::UpdatePayload::MinStake(25_000_000),
        "MAJORITY-EXPLOIT §6 lever: raise min_stake mid-event"
    );
    assert_eq!(
        pu.proposed_by,
        mutual_pda(1),
        "the mutual PDA is the subaccord authority"
    );
    assert_eq!(
        pu.execute_after_slot,
        slot + 432_000,
        "48h timelock (ADR-0005)"
    );
}

#[test]
fn non_admin_reverts() {
    let (mut env, cfg) = setup_with_mutual(1);
    let stranger = cranker(&mut env);
    assert_custom_err(
        param_tx(
            &mut env,
            &cfg,
            &stranger,
            0,
            hanse::instructions::SubaccordParam::MinStake(25_000_000),
        ),
        hanse::HanseError::Unauthorized,
    );
}

#[test]
fn accord_bounds_still_enforced() {
    let (mut env, cfg) = setup_with_mutual(1);
    // min_stake 0 is below accord's own floor — rejected at propose time
    // (H-1: immediate feedback, no wasted timelock).
    let admin = admin(&env);
    let err = param_tx(
        &mut env,
        &cfg,
        &admin,
        0,
        hanse::instructions::SubaccordParam::MinStake(0),
    )
    .unwrap_err();
    assert!(
        err.contains("Custom("),
        "accord-side rejection relayed: {err}"
    );
}

#[test]
fn timelocked_execute_lands_after_warp() {
    let (mut env, cfg) = setup_with_mutual(1);
    let admin = admin(&env);
    param_tx(
        &mut env,
        &cfg,
        &admin,
        0,
        hanse::instructions::SubaccordParam::MinStake(25_000_000),
    )
    .unwrap();

    // Before the timelock expires: accord refuses.
    let caller = cranker(&mut env);
    env.svm.expire_blockhash();
    let early = execute_update_tx(&mut env, &cfg, &caller, 0).unwrap_err();
    assert!(early.contains("Custom("), "timelock holds: {early}");

    // Warp 48h of slots, then the permissionless execute lands.
    let mut clock = env.svm.get_sysvar::<solana_clock::Clock>();
    clock.slot += 432_001;
    env.svm.set_sysvar::<solana_clock::Clock>(&clock);
    env.svm.expire_blockhash();
    execute_update_tx(&mut env, &cfg, &caller, 0).unwrap();

    let sub = subacc(&env, &cfg);
    let s: accord::state::Subaccord = anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env.svm.get_account(&sub).unwrap().data[..],
    )
    .unwrap();
    assert_eq!(s.min_stake, 25_000_000);
}
