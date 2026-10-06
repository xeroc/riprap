//! tier_cap.rs — the cumulative per-membership cap (audit H-1 2026-09-24,
//! EVENT-MUTUAL §2.3): `file_claim` clamps to `max_payout − cap_used` and
//! reverts `TierCapExhausted` at zero remaining. Denied/Failed claims release
//! their reservation at settle_claim. Since the multi-claim amendment this is
//! the only filing limiter — concurrent claims share the cap.

mod common;

use {
    anchor_lang::solana_program::pubkey::Pubkey,
    common::*,
    solana_keypair::Keypair,
    solana_signer::Signer,
};

const FEE: u64 = 4 * 1_000_000;
/// Tier 1: contribution 20_000_000, max_payout 2_000_000_000 (§6, policy §7).
const CAP: u64 = 2_000_000_000;

fn setup() -> (
    Env,
    hanse::instructions::InitializeMutualConfig,
    Keypair,
    Pubkey,
) {
    let (mut env, cfg) = setup_with_mutual(1);
    init_accord_state(&mut env);
    let (member, member_ata) = member_with(&mut env, 50_000_000);
    join_member(&mut env, &cfg, &member, &member_ata, 1).unwrap();
    arm_subaccord(&mut env, &cfg, 3);
    (env, cfg, member, member_ata)
}

fn read_claim(env: &Env, nonce: u64) -> hanse::Claim {
    anchor_lang::AccountDeserialize::try_deserialize(
        &mut &env.svm.get_account(&claim_pda(&mutual_pda(1), nonce)).unwrap().data[..],
    )
    .unwrap()
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

/// H-1 core regression: an Approved settlement consumes the cap for good —
/// the settle→payout window must not re-open the full cap.
#[test]
fn approved_claim_exhausts_cap_against_refile() {
    let (mut env, cfg, member, _) = setup();
    file_claim_raw(&mut env, &cfg, &member, CAP).unwrap();

    let mutual = mutual_pda(1);
    force_final(&mut env.svm, &dispute_pda(&mutual, 0), 0);
    let crank = cranker(&mut env);
    settle_claim_raw(&mut env, &cfg, &crank, 0).unwrap();

    let mem = member_of(&env, &member.pubkey());
    assert_eq!(mem.cap_used, CAP, "Approved keeps the reservation");

    env.svm.expire_blockhash();
    assert_custom_err(
        file_claim_raw(&mut env, &cfg, &member, 100),
        hanse::HanseError::TierCapExhausted,
    );
}

/// Partial claims refile at the REMAINING cap only — the clamp is
/// min(requested, max_payout − cap_used), never the bare tier max.
#[test]
fn refile_clamps_to_remaining_cap() {
    let (mut env, cfg, member, _) = setup();
    file_claim_raw(&mut env, &cfg, &member, 500_000_000).unwrap();
    let mutual = mutual_pda(1);
    force_final(&mut env.svm, &dispute_pda(&mutual, 0), 0);
    let crank = cranker(&mut env);
    settle_claim_raw(&mut env, &cfg, &crank, 0).unwrap();

    env.svm.expire_blockhash();
    file_claim_raw(&mut env, &cfg, &member, 5_000_000_000).unwrap();
    assert_eq!(
        read_claim(&env, 1).claim_amount,
        CAP - 500_000_000,
        "second filing clamps to the remaining cap, not the tier max"
    );
    assert_eq!(member_of(&env, &member.pubkey()).cap_used, CAP);

    let crank = cranker(&mut env);
    force_final(&mut env.svm, &dispute_pda(&mutual, 1), 0);
    env.svm.expire_blockhash();
    settle_claim_raw(&mut env, &cfg, &crank, 1).unwrap();

    env.svm.expire_blockhash();
    assert_custom_err(
        file_claim_raw(&mut env, &cfg, &member, 100),
        hanse::HanseError::TierCapExhausted,
    );
}

/// Denied claims are unpaid — their reservation releases at settlement.
#[test]
fn denied_claim_releases_cap() {
    let (mut env, cfg, member, _) = setup();
    file_claim_raw(&mut env, &cfg, &member, CAP).unwrap();
    let mutual = mutual_pda(1);
    force_final(&mut env.svm, &dispute_pda(&mutual, 0), 1);
    let crank = cranker(&mut env);
    settle_claim_raw(&mut env, &cfg, &crank, 0).unwrap();

    assert_eq!(
        member_of(&env, &member.pubkey()).cap_used,
        0,
        "Denied releases the reservation"
    );

    env.svm.expire_blockhash();
    file_claim_raw(&mut env, &cfg, &member, 5_000_000_000).unwrap();
    assert_eq!(
        read_claim(&env, 1).claim_amount,
        CAP,
        "full cap available again after a denial"
    );
}

/// Failed disputes are unpaid too — same release (the float is funded to let
/// settle_claim's refund transfer pass; the refund amount itself is H-2).
#[test]
fn failed_claim_releases_cap() {
    let (mut env, cfg, member, _) = setup();
    file_claim_raw(&mut env, &cfg, &member, CAP).unwrap();
    fund_float(&mut env, FEE);

    let mutual = mutual_pda(1);
    force_failed(&mut env.svm, &dispute_pda(&mutual, 0));
    let crank = cranker(&mut env);
    settle_claim_raw(&mut env, &cfg, &crank, 0).unwrap();

    assert_eq!(
        member_of(&env, &member.pubkey()).cap_used,
        0,
        "Failed releases the reservation"
    );

    env.svm.expire_blockhash();
    file_claim_raw(&mut env, &cfg, &member, CAP).unwrap();
    assert_eq!(read_claim(&env, 1).claim_amount, CAP);
}

/// The release is bounded by the settled claim's own amount — settle runs
/// once per claim (ClaimNotPending), so this pins the accounting shape.
#[test]
fn fresh_member_has_zero_cap_used() {
    let (mut env, cfg, member, _) = setup();
    assert_eq!(member_of(&env, &member.pubkey()).cap_used, 0);
    file_claim_raw(&mut env, &cfg, &member, 700_000_000).unwrap();
    assert_eq!(member_of(&env, &member.pubkey()).cap_used, 700_000_000);
}
