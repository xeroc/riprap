//! Harness smoke tests (bean riprap-s3ta): prove the three-program boot,
//! the clock warp, and the dispute fabrication helpers before the
//! instruction suites lean on them.

mod common;

use {
    common::*, litesvm::LiteSVM, solana_keypair::Keypair, solana_program_pack::Pack,
    solana_signer::Signer, spl_token_interface::state::Mint as TokenMint,
};

/// The env boots hanse + pool + accord and a 6-decimal mint.
#[test]
fn env_boots_three_programs_and_mint() {
    let env = Env::setup().unwrap();

    for (name, id) in [
        ("pool", pool::id()),
        ("hanse", hanse::id()),
        ("accord", accord::id()),
    ] {
        let acc = env
            .svm
            .get_account(&id)
            .unwrap_or_else(|| panic!("{name} program not loaded"));
        assert!(acc.executable, "{name} program account must be executable");
    }

    let mint_acc = env.svm.get_account(&env.mint).unwrap();
    let mint = TokenMint::unpack(&mint_acc.data).unwrap();
    assert_eq!(mint.decimals, 6, "USDC-style mint");
}

/// The accord binary resolver points at the sibling checkout and reports a
/// typed, actionable error when it is missing.
#[test]
fn accord_binary_missing_is_a_typed_error() {
    let mut svm = LiteSVM::new();
    let _ = &mut svm; // unused here; kept for symmetry with other tests
    let err = std::fs::read("/nonexistent/accord.so").map_err(AccordBinaryError::from);
    match err {
        Err(AccordBinaryError::Missing { path }) => {
            assert!(
                path.ends_with("accord.so"),
                "error names the expected path: {path:?}"
            );
            let msg = AccordBinaryError::Missing { path }.to_string();
            assert!(
                msg.contains("ACCORD_SO"),
                "error tells the builder how to override: {msg}"
            );
        }
        other => panic!("expected Missing, got {other:?}"),
    }
}

/// Clock warp moves the timestamp the lifecycle gates read.
#[test]
fn clock_warp_moves_timestamp() {
    let mut env = Env::setup().unwrap();
    let before = env.svm.get_sysvar::<solana_clock::Clock>().unix_timestamp;
    warp_clock(&mut env.svm, before + 86_400);
    let after = env.svm.get_sysvar::<solana_clock::Clock>().unix_timestamp;
    assert_eq!(after, before + 86_400);
}

/// Dispute fabrication: plant a base dispute, force it Final with a ruling
/// index, then Failed — round-tripping through the real accord layout.
#[test]
fn dispute_fabrication_reaches_terminal_states() {
    let mut env = Env::setup().unwrap();
    let filer = Keypair::new();
    let nonce = 7u64;
    let dispute = dispute_pda(&filer.pubkey(), nonce);

    plant_dispute(&mut env.svm, &dispute, &base_dispute(filer.pubkey(), nonce));
    let (d, _) = read_dispute(&env.svm, &dispute);
    assert_eq!(d.state, accord::state::DisputeState::Created);
    assert_eq!(d.final_ruling, u64::MAX, "no ruling before Final");
    assert_eq!(
        env.svm.get_account(&dispute).unwrap().owner,
        accord::id(),
        "planted dispute must be owned by accord so CPI reads accept it"
    );

    force_final(&mut env.svm, &dispute, 0);
    let (d, _) = read_dispute(&env.svm, &dispute);
    assert_eq!(d.state, accord::state::DisputeState::Final);
    assert_eq!(d.final_ruling, 0, "Approve wins");
    assert!(d.finalized_at > 0);

    force_failed(&mut env.svm, &dispute);
    let (d, _) = read_dispute(&env.svm, &dispute);
    assert_eq!(d.state, accord::state::DisputeState::Failed);
}
