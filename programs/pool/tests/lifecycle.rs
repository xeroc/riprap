//! LiteSVM lifecycle suite — the handoff test matrix against the real SBF
//! build (target/deploy/pool.so, built by `anchor build`).
//!
//! Cite: milestone HANDOFF §6 Test Matrix; every assertion traces to a row
//! there or to the data contract §2.

use {
    anchor_lang::{
        solana_program::{instruction::Instruction, pubkey::Pubkey, system_program},
        AccountDeserialize, InstructionData, ToAccountMetas,
    },
    litesvm::LiteSVM,
    solana_keypair::Keypair,
    solana_message::{Message, VersionedMessage},
    solana_signer::Signer,
    solana_transaction::versioned::VersionedTransaction,
    spl_associated_token_account_interface::{
        address::get_associated_token_address, instruction as ata_ix,
    },
    solana_program_pack::Pack,
    spl_token_interface::instruction as token_ix,
};

const WASM: &[u8] = include_bytes!("../../../target/deploy/pool.so");

struct Env {
    svm: LiteSVM,
    payer: Keypair,
    sponsor: Keypair,
    mint: Pubkey,
    pool: Pubkey,
    treasury: Pubkey,
    ownership_authority: Keypair,
    rights_authority: Keypair,
}

impl Env {
    /// Pool with rates 0/1/2 (ownership closed, rights open at 1, yield at 2).
    fn setup(seed: u64) -> Self {
        let program_id = pool::id();
        let payer = Keypair::new();
        let sponsor = Keypair::new();
        let mint_kp = Keypair::new();
        let ownership_authority = Keypair::new();
        let rights_authority = Keypair::new();

        let mut svm = LiteSVM::new();
        svm.add_program(program_id, WASM).unwrap();
        svm.airdrop(&payer.pubkey(), 50_000_000_000).unwrap();
        // Rent sponsor: pays depositor rent + tx fees on deposits, never the
        // owner (fee sponsoring).
        svm.airdrop(&sponsor.pubkey(), 50_000_000_000).unwrap();
        // Authorities sign transactions; a signer account must exist.
        svm.airdrop(&ownership_authority.pubkey(), 1_000_000_000).unwrap();
        svm.airdrop(&rights_authority.pubkey(), 1_000_000_000).unwrap();

        // A real SPL mint: system create_account + initialize_mint2.
        send(
            &mut svm,
            &[
                create_account(&payer, &mint_kp, 10_000_000_000, 82, &spl_token_interface::ID),
                token_ix::initialize_mint2(
                    &spl_token_interface::ID,
                    &mint_kp.pubkey(),
                    &payer.pubkey(),
                    None,
                    6,
                )
                .unwrap(),
            ],
            &mut [&payer, &mint_kp],
        );

        let (pool, _bump) =
            Pubkey::find_program_address(&[b"pool", seed.to_le_bytes().as_ref()], &program_id);

        send(
            &mut svm,
            &[Instruction::new_with_bytes(
                program_id,
                &pool::instruction::Init {
                    params: pool::InitParams {
                        seed,
                        ownership_rate: 0,
                        rights_rate: 1,
                        yield_rate: 2,
                        ownership_authority: ownership_authority.pubkey(),
                        rights_authority: rights_authority.pubkey(),
                        yield_authority: Pubkey::new_unique(),
                    },
                }
                .data(),
                pool::accounts::InitPool {
                    rent_payer: payer.pubkey(),
                    mint: mint_kp.pubkey(),
                    pool,
                    treasury: get_associated_token_address(&pool, &mint_kp.pubkey()),
                    token_program: spl_token_interface::ID,
                    associated_token_program:
                        spl_associated_token_account_interface::program::ID,
                    system_program: system_program::ID,
                }
                .to_account_metas(None),
            )],
            &mut [&payer],
        );

        Self {
            svm,
            payer,
            sponsor,
            mint: mint_kp.pubkey(),
            pool,
            treasury: get_associated_token_address(&pool, &mint_kp.pubkey()),
            ownership_authority,
            rights_authority,
        }
    }

    fn treasury_balance(&self) -> u64 {
        token_amount(&self.svm, &self.treasury)
    }

    fn pool_state(&self) -> pool::Pool {
        let acct = self.svm.get_account(&self.pool).unwrap();
        pool::Pool::try_deserialize(&mut &acct.data[..]).unwrap()
    }

    /// Create + fund a depositor's ATA, returning (owner, ata, depositor PDA).
    fn depositor(&mut self, balance: u64) -> (Keypair, Pubkey, Pubkey) {
        let owner = Keypair::new();
        let ata = get_associated_token_address(&owner.pubkey(), &self.mint);
        self.svm.airdrop(&owner.pubkey(), 1_000_000_000).unwrap();
        send(
            &mut self.svm,
            &[
                ata_ix::create_associated_token_account_idempotent(
                    &self.payer.pubkey(),
                    &owner.pubkey(),
                    &self.mint,
                    &spl_token_interface::ID,
                ),
                token_ix::mint_to(
                    &spl_token_interface::ID,
                    &self.mint,
                    &ata,
                    &self.payer.pubkey(),
                    &[],
                    balance,
                )
                .unwrap(),
            ],
            &mut [&self.payer],
        );
        let depositor = Pubkey::find_program_address(
            &[b"depositor", self.pool.as_ref(), owner.pubkey().as_ref()],
            &pool::id(),
        )
        .0;
        (owner, ata, depositor)
    }

    fn deposit(&mut self, owner: &Keypair, ata: &Pubkey, track: pool::Track, amount: u64) -> Result<(), String> {
        self.svm_airdrop_if_needed(owner);
        let ix = Instruction::new_with_bytes(
            pool::id(),
            &pool::instruction::Deposit { track, amount }.data(),
            pool::accounts::Deposit {
                pool: self.pool,
                depositor: Pubkey::find_program_address(
                    &[b"depositor", self.pool.as_ref(), owner.pubkey().as_ref()],
                    &pool::id(),
                )
                .0,
                owner: owner.pubkey(),
                owner_ata: *ata,
                rent_payer: self.sponsor.pubkey(),
                treasury: self.treasury,
                token_program: spl_token_interface::ID,
                system_program: system_program::ID,
            }
            .to_account_metas(None),
        );
        try_send(&mut self.svm, &[ix], &mut [&self.sponsor, owner])
    }

    fn svm_airdrop_if_needed(&mut self, _owner: &Keypair) {}

    fn spend(&mut self, authority: &Keypair, destination: &Pubkey, amount: u64) -> Result<(), String> {
        let ix = Instruction::new_with_bytes(
            pool::id(),
            &pool::instruction::Spend { amount }.data(),
            pool::accounts::Spend {
                pool: self.pool,
                rights_authority: authority.pubkey(),
                treasury: self.treasury,
                destination: *destination,
                token_program: spl_token_interface::ID,
            }
            .to_account_metas(None),
        );
        try_send(&mut self.svm, &[ix], &mut [authority])
    }

    fn burn(
        &mut self,
        authority: &Keypair,
        owner: &Pubkey,
        track: pool::Track,
        amount: u64,
    ) -> Result<(), String> {
        let ix = Instruction::new_with_bytes(
            pool::id(),
            &pool::instruction::Burn { track, amount }.data(),
            pool::accounts::Burn {
                pool: self.pool,
                authority: authority.pubkey(),
                depositor: Pubkey::find_program_address(
                    &[b"depositor", self.pool.as_ref(), owner.as_ref()],
                    &pool::id(),
                )
                .0,
                owner: *owner,
            }
            .to_account_metas(None),
        );
        try_send(&mut self.svm, &[ix], &mut [authority])
    }

    fn depositor_state(&self, owner: &Pubkey) -> pool::Depositor {
        let pda = Pubkey::find_program_address(
            &[b"depositor", self.pool.as_ref(), owner.as_ref()],
            &pool::id(),
        )
        .0;
        let acct = self.svm.get_account(&pda).unwrap();
        pool::Depositor::try_deserialize(&mut &acct.data[..]).unwrap()
    }
}

fn token_amount(svm: &LiteSVM, ata: &Pubkey) -> u64 {
    use spl_token_interface::state::Account as TokenAccount;
    let acct = svm.get_account(ata).unwrap();
    TokenAccount::unpack(&acct.data).unwrap().amount
}

fn create_account(
    payer: &Keypair,
    to: &Keypair,
    lamports: u64,
    space: u64,
    owner: &Pubkey,
) -> Instruction {
    // SystemInstruction::CreateAccount: u32(0) + u64 lamports + u64 space + owner.
    let mut data = Vec::with_capacity(52);
    data.extend_from_slice(&0u32.to_le_bytes());
    data.extend_from_slice(&lamports.to_le_bytes());
    data.extend_from_slice(&space.to_le_bytes());
    data.extend_from_slice(owner.as_ref());
    Instruction::new_with_bytes(
        system_program::ID,
        &data,
        vec![
            anchor_lang::solana_program::instruction::AccountMeta::new(payer.pubkey(), true),
            anchor_lang::solana_program::instruction::AccountMeta::new(to.pubkey(), true),
        ],
    )
}

fn send(svm: &mut LiteSVM, ixs: &[Instruction], signers: &mut [&Keypair]) {
    try_send(svm, ixs, signers).unwrap();
}

fn try_send(svm: &mut LiteSVM, ixs: &[Instruction], signers: &mut [&Keypair]) -> Result<(), String> {
    let blockhash = svm.latest_blockhash();
    let msg = Message::new_with_blockhash(ixs, Some(&signers[0].pubkey()), &blockhash);
    let tx = VersionedTransaction::try_new(VersionedMessage::Legacy(msg), signers).unwrap();
    svm.send_transaction(tx)
        .map(|_| ())
        .map_err(|e| format!("{e:?}"))
}

/// Custom error assertions: match the code inside the Debug output — crude but
/// immune to the nested error-type reshuffling across solana crate versions.
/// Custom code = `PoolError variant as u32 + 6000` (ERROR_CODE_OFFSET).
fn assert_custom_err(res: Result<(), String>, expected: pool::error::PoolError) {
    let err = res.unwrap_err();
    let code = expected as u32 + 6000;
    assert!(
        err.contains(&format!("Custom({code})")),
        "expected {expected:?} (code {code}), got: {err}"
    );
}

/// Matrix row 1: Open pool, rights_rate=1, deposit 20 USDC → totals 20e6,
/// stake 20e6, treasury +20e6. Plus full 10/20/40 + spend 2000 + crank-all.
#[test]
fn lifecycle_deposit_spend_liquidate_crank() {
    let mut env = Env::setup(1);

    // Deposits 10/20/40 into rights (rate 1): total 70, all stake = amount.
    let (o1, a1, _d1) = env.depositor(10_000_000);
    let (o2, a2, d2) = env.depositor(20_000_000);
    let (o3, a3, _d3) = env.depositor(40_000_000);

    // Fee sponsoring: the sponsor pays depositor rent + tx fees; the owner's
    // lamports must not move at all.
    let o1_before = env.svm.get_account(&o1.pubkey()).unwrap().lamports;
    let sponsor_before = env.svm.get_account(&env.sponsor.pubkey()).unwrap().lamports;
    env.deposit(&o1, &a1, pool::Track::Rights, 10_000_000).unwrap();
    env.deposit(&o2, &a2, pool::Track::Rights, 20_000_000).unwrap();
    env.deposit(&o3, &a3, pool::Track::Rights, 40_000_000).unwrap();
    assert_eq!(
        env.svm.get_account(&o1.pubkey()).unwrap().lamports,
        o1_before,
        "owner must pay nothing when a sponsor covers rent"
    );
    assert!(
        env.svm.get_account(&env.sponsor.pubkey()).unwrap().lamports < sponsor_before,
        "sponsor must have paid rent + fees"
    );

    assert_eq!(env.treasury_balance(), 70_000_000);
    let p = env.pool_state();
    assert_eq!(p.total_amount, 70_000_000);
    assert_eq!(p.state, pool::PoolState::Open);

    // Row 1 checks on depositor 2 (the 20 USDC depositor).
    let acct = env.svm.get_account(&d2).unwrap();
    let dep = pool::Depositor::try_deserialize(&mut &acct.data[..]).unwrap();
    assert_eq!(dep.total_amount, 20_000_000);
    assert_eq!(dep.rights_stake, 20_000_000);

    // Spend 2000 to the payer's ATA (rights authority pushes).
    let payee_ata = get_associated_token_address(&env.payer.pubkey(), &env.mint);
    send(
        &mut env.svm,
        &[ata_ix::create_associated_token_account_idempotent(
            &env.payer.pubkey(),
            &env.payer.pubkey(),
            &env.mint,
            &spl_token_interface::ID,
        )],
        &mut [&env.payer],
    );
    let rights = env.rights_authority.insecure_clone();
    env.spend(&rights, &payee_ata, 2_000_000).unwrap();
    assert_eq!(env.treasury_balance(), 68_000_000);
    assert_eq!(token_amount(&env.svm, &payee_ata), 2_000_000);

    // Liquidate (ownership authority), terminal.
    send(
        &mut env.svm,
        &[Instruction::new_with_bytes(
            pool::id(),
            &pool::instruction::Liquidate {}.data(),
            pool::accounts::Liquidate {
                pool: env.pool,
                ownership_authority: env.ownership_authority.pubkey(),
                treasury: env.treasury,
                token_program: spl_token_interface::ID,
            }
            .to_account_metas(None),
        )],
        &mut [&env.ownership_authority],
    );
    assert_eq!(env.pool_state().state, pool::PoolState::Liquidated);

    // Crank all three: money-weighted floor(share × 68e6).
    let crank = |env: &mut Env, owner: &Keypair| {
        let (_, _, depositor) = ((), (), Pubkey::find_program_address(
            &[b"depositor", env.pool.as_ref(), owner.pubkey().as_ref()],
            &pool::id(),
        ).0);
        let destination = get_associated_token_address(&owner.pubkey(), &env.mint);
        let ix = Instruction::new_with_bytes(
            pool::id(),
            &pool::instruction::Crank {}.data(),
            pool::accounts::Crank {
                pool: env.pool,
                cranker: env.payer.pubkey(),
                depositor,
                owner: owner.pubkey(),
                destination,
                treasury: env.treasury,
                token_program: spl_token_interface::ID,
                associated_token_program: spl_associated_token_account_interface::program::ID,
            }
            .to_account_metas(None),
        );
        send(&mut env.svm, &[ix], &mut [&env.payer]);
        token_amount(&env.svm, &destination)
    };
    let pay1 = crank(&mut env, &o1);
    let pay2 = crank(&mut env, &o2);
    let pay3 = crank(&mut env, &o3);
    // floor(10/70×68e6)=9714285, floor(20/70×68e6)=19428571, floor(40/70×68e6)=38857142
    assert_eq!(pay1, 9_714_285);
    assert_eq!(pay2, 19_428_571);
    assert_eq!(pay3, 38_857_142);
    assert!(pay1 + pay2 + pay3 <= 68_000_000); // sum <= balance (2 dust left)
    assert_eq!(env.treasury_balance(), 2); // 2 lamports of floor dust stranded

    // Double crank reverts: Settled.
    let (_, _, depositor) = ((), (), Pubkey::find_program_address(
        &[b"depositor", env.pool.as_ref(), o1.pubkey().as_ref()],
        &pool::id(),
    ).0);
    let destination = get_associated_token_address(&o1.pubkey(), &env.mint);
// Re-crank from a different cranker: dodges litesvm's identical-tx dedup
    // AND proves the crank is permissionless — payout goes to the depositor's
    // owner regardless of who turns the handle.
    let other_cranker = Keypair::new();
    env.svm.airdrop(&other_cranker.pubkey(), 1_000_000_000).unwrap();
    let crank_from_other = Instruction::new_with_bytes(
        pool::id(),
        &pool::instruction::Crank {}.data(),
        pool::accounts::Crank {
            pool: env.pool,
            cranker: other_cranker.pubkey(),
            depositor,
            owner: o1.pubkey(),
            destination,
            treasury: env.treasury,
            token_program: spl_token_interface::ID,
            associated_token_program: spl_associated_token_account_interface::program::ID,
        }
        .to_account_metas(None),
    );
    let res = try_send(&mut env.svm, &[crank_from_other], &mut [&other_cranker]);
    assert_custom_err(res, pool::error::PoolError::Settled);
    assert_eq!(token_amount(&env.svm, &destination), 9_714_285); // unchanged

    // Deposit after liquidation reverts: PoolNotOpen. Fresh depositor, since
    // a settled one trips Settled first (both are correct refusals).
    let (o4, a4, _) = env.depositor(4_000_000);
    let res = env.deposit(&o4, &a4, pool::Track::Rights, 1);
    assert_custom_err(res, pool::error::PoolError::PoolNotOpen);
}

/// Matrix row 2: rate 0 track → TrackClosed.
#[test]
fn deposit_into_closed_track_reverts() {
    let mut env = Env::setup(2);
    let (o1, a1, _) = env.depositor(5_000_000);
    let res = env.deposit(&o1, &a1, pool::Track::Ownership, 1_000_000); // rate 0
    assert_custom_err(res, pool::error::PoolError::TrackClosed);
}

/// Matrix row 4: non-authorities cannot spend, liquidate, or rotate authority.
#[test]
fn non_authority_reverts() {
    let mut env = Env::setup(3);
    let impostor = Keypair::new();
    env.svm.airdrop(&impostor.pubkey(), 1_000_000_000).unwrap();
    let dest = get_associated_token_address(&impostor.pubkey(), &env.mint);

    let res = env.spend(&impostor, &dest, 1);
    assert!(res.is_err(), "non-authority spend must revert");

    let ix = Instruction::new_with_bytes(
        pool::id(),
        &pool::instruction::Liquidate {}.data(),
        pool::accounts::Liquidate {
            pool: env.pool,
            ownership_authority: impostor.pubkey(),
            treasury: env.treasury,
            token_program: spl_token_interface::ID,
        }
        .to_account_metas(None),
    );
    let res = try_send(&mut env.svm, &[ix], &mut [&impostor]);
    assert!(res.is_err(), "non-authority liquidate must revert");

    let ix = Instruction::new_with_bytes(
        pool::id(),
        &pool::instruction::UpdateAuthority {
            track: pool::Track::Rights,
            new: impostor.pubkey(),
        }
        .data(),
        pool::accounts::UpdateAuthority {
            pool: env.pool,
            authority: impostor.pubkey(),
        }
        .to_account_metas(None),
    );
    let res = try_send(&mut env.svm, &[ix], &mut [&impostor]);
    assert!(res.is_err(), "non-authority update_authority must revert");

    // Nothing moved, nothing changed.
    assert_eq!(env.treasury_balance(), 0);
    assert_eq!(env.pool_state().state, pool::PoolState::Open);
}

/// Matrix row 6: update_authority(rights, K2) → K2 can spend, K1 cannot.
#[test]
fn authority_rotation_hands_off_powers() {
    let mut env = Env::setup(4);
    let (o1, a1, _) = env.depositor(5_000_000);
    env.deposit(&o1, &a1, pool::Track::Rights, 5_000_000).unwrap();

    let k2 = Keypair::new();
    env.svm.airdrop(&k2.pubkey(), 1_000_000_000).unwrap();
    let ix = Instruction::new_with_bytes(
        pool::id(),
        &pool::instruction::UpdateAuthority {
            track: pool::Track::Rights,
            new: k2.pubkey(),
        }
        .data(),
        pool::accounts::UpdateAuthority {
            pool: env.pool,
            authority: env.rights_authority.pubkey(),
        }
        .to_account_metas(None),
    );
    send(&mut env.svm, &[ix], &mut [&env.rights_authority]);
    assert_eq!(env.pool_state().rights_authority, k2.pubkey());

    let dest = get_associated_token_address(&k2.pubkey(), &env.mint);
    send(
        &mut env.svm,
        &[ata_ix::create_associated_token_account_idempotent(
            &env.payer.pubkey(),
            &k2.pubkey(),
            &env.mint,
            &spl_token_interface::ID,
        )],
        &mut [&env.payer],
    );

    let rights = env.rights_authority.insecure_clone();
    let res = env.spend(&rights, &dest, 1); // old authority
    assert!(res.is_err(), "K1 must lose spend after rotation");
    env.spend(&k2, &dest, 1_000_000).unwrap(); // new authority
    assert_eq!(token_amount(&env.svm, &dest), 1_000_000);
}

/// Matrix row 3 (spend half): spend after liquidation reverts.
#[test]
fn spend_after_liquidation_reverts() {
    let mut env = Env::setup(5);
    let (o1, a1, _) = env.depositor(5_000_000);
    env.deposit(&o1, &a1, pool::Track::Rights, 5_000_000).unwrap();
    send(
        &mut env.svm,
        &[Instruction::new_with_bytes(
            pool::id(),
            &pool::instruction::Liquidate {}.data(),
            pool::accounts::Liquidate {
                pool: env.pool,
                ownership_authority: env.ownership_authority.pubkey(),
                treasury: env.treasury,
                token_program: spl_token_interface::ID,
            }
            .to_account_metas(None),
        )],
        &mut [&env.ownership_authority],
    );
    let rights = env.rights_authority.insecure_clone();
    let dest = get_associated_token_address(&rights.pubkey(), &env.mint);
    send(
        &mut env.svm,
        &[ata_ix::create_associated_token_account_idempotent(
            &env.payer.pubkey(),
            &rights.pubkey(),
            &env.mint,
            &spl_token_interface::ID,
        )],
        &mut [&env.payer],
    );
    let res = env.spend(&rights, &dest, 1);
    assert_custom_err(res, pool::error::PoolError::PoolNotOpen);
}

/// EVENT-MUTUAL §2.4: rights-authority burn at rate 1 zeroes the paid
/// claimant's totals and moves NO tokens — spend already moved the money.
#[test]
fn burn_happy_path_rate_1_moves_no_tokens() {
    let mut env = Env::setup(6);
    let (o1, a1, _) = env.depositor(20_000_000);
    env.deposit(&o1, &a1, pool::Track::Rights, 20_000_000).unwrap();

    let rights = env.rights_authority.insecure_clone();
    env.burn(&rights, &o1.pubkey(), pool::Track::Rights, 20_000_000)
        .unwrap();

    let d = env.depositor_state(&o1.pubkey());
    assert_eq!(d.total_amount, 0);
    assert_eq!(d.rights_stake, 0);
    assert!(!d.settled, "burn never marks a depositor settled");
    assert_eq!(env.pool_state().total_amount, 0);
    assert_eq!(env.treasury_balance(), 20_000_000, "burn moves no tokens");
}

/// Matrix row 4 (burn): a signer that is not the track's authority cannot
/// burn — the ownership authority has no power over the rights track.
#[test]
fn burn_wrong_authority_reverts() {
    let mut env = Env::setup(7);
    let (o1, a1, _) = env.depositor(5_000_000);
    env.deposit(&o1, &a1, pool::Track::Rights, 5_000_000).unwrap();

    let ownership = env.ownership_authority.insecure_clone();
    let res = env.burn(&ownership, &o1.pubkey(), pool::Track::Rights, 1);
    assert!(res.is_err(), "non-authority burn must revert");

    assert_eq!(env.depositor_state(&o1.pubkey()).total_amount, 5_000_000);
    assert_eq!(env.pool_state().total_amount, 5_000_000);
}

/// Spec §5: liquidate freezes burn — same door-closing as spend.
#[test]
fn burn_after_liquidate_reverts() {
    let mut env = Env::setup(8);
    let (o1, a1, _) = env.depositor(5_000_000);
    env.deposit(&o1, &a1, pool::Track::Rights, 5_000_000).unwrap();
    send(
        &mut env.svm,
        &[Instruction::new_with_bytes(
            pool::id(),
            &pool::instruction::Liquidate {}.data(),
            pool::accounts::Liquidate {
                pool: env.pool,
                ownership_authority: env.ownership_authority.pubkey(),
                treasury: env.treasury,
                token_program: spl_token_interface::ID,
            }
            .to_account_metas(None),
        )],
        &mut [&env.ownership_authority],
    );
    let rights = env.rights_authority.insecure_clone();
    let res = env.burn(&rights, &o1.pubkey(), pool::Track::Rights, 1);
    assert_custom_err(res, pool::error::PoolError::PoolNotOpen);
}

/// Grill 2026-09-01 Q1: an over-burn is Ok and floors at the balances —
/// burn saturates, never reverts, never underflows.
#[test]
fn burn_saturates_at_balance() {
    let mut env = Env::setup(9);
    let (o1, a1, _) = env.depositor(5_000_000);
    env.deposit(&o1, &a1, pool::Track::Rights, 5_000_000).unwrap();

    let rights = env.rights_authority.insecure_clone();
    env.burn(&rights, &o1.pubkey(), pool::Track::Rights, 999_999_999)
        .unwrap();

    let d = env.depositor_state(&o1.pubkey());
    assert_eq!(d.total_amount, 0);
    assert_eq!(d.rights_stake, 0);
    assert_eq!(env.pool_state().total_amount, 0);
    assert_eq!(env.treasury_balance(), 5_000_000);
}
