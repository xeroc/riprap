//! SAS (Solana Attestation Service) CPI — the closed-circle half of the juror
//! gate (EVENT-MUTUAL §2.8, bean riprap-7wa9).
//!
//! SAS is a Pinocchio program (not Anchor): there is no CPI crate, so the
//! three instructions hanse needs are hand-encoded against the source layout
//! (solana-foundation/solana-attestation-service, `program/src/instructions.rs`
//! + `processor/*`). Instruction data is one `u8` tag (the entrypoint strips
//! it before the arg parser) followed by hand-rolled length-prefixed args —
//! `u32` LE lengths, no borsh string tags.
//!
//! Account PDAs (all under [`ID`]):
//! - credential  = `["credential", authority, name]`
//! - schema      = `["schema", credential, name, [1]]` (version fixed at 1)
//! - attestation = `["attestation", credential, schema, nonce]`
//!
//! The mutual's authority everywhere is the Mutual PDA: it signs the
//! credential/schema creation and every attestation via `invoke_signed`, so
//! membership attestations can only be issued by `join` — the closed circle
//! accord's `juror_credential` binding then enforces (PROG-ATTESTTION).

use anchor_lang::prelude::*;
use solana_program::instruction::{AccountMeta, Instruction};
use solana_program::program::invoke_signed;

/// The canonical SAS program (solanaattestations.com). Attestation accounts
/// it owns are what accord's stake gate accepts — hanse must CPI into exactly
/// this program or the gate would reject its own members' attestations.
pub const ID: Pubkey = pubkey!("22zoJMtdu4tQc2PzL74ZUT7FrwgB1Udec8DdW4yw4BdG");

pub const CREDENTIAL_SEED: &[u8] = b"credential";
pub const SCHEMA_SEED: &[u8] = b"schema";
pub const ATTESTATION_SEED: &[u8] = b"attestation";

/// Credential name. The credential PDA is namespaced by its authority (the
/// mutual PDA, unique per seed), so one fixed name is enough — one
/// credential, one schema, one attestation per member per mutual.
pub const CREDENTIAL_NAME: &[u8] = b"members";
pub const SCHEMA_NAME: &[u8] = b"membership";
const SCHEMA_DESCRIPTION: &[u8] = b"riprap mutual membership: data is the member wallet";

/// `SchemaDataTypes` tags (SAS `state/schema.rs`): 4 = U128. Two U128s = 32
/// raw bytes with NO length prefix — the only fixed-width composition that
/// (a) passes SAS `validate_data` (16 + 16 == data.len()) and (b) keeps the
/// subject wallet at `data[0..32]`, where accord's gate reads it
/// (PROG-ATTESTTION subject binding). A `VecU8` field would prepend a u32
/// length and shift the wallet off accord's fixed offset.
pub const SCHEMA_LAYOUT: &[u8] = &[4, 4];
/// Borsh strings for the two u128 halves of the member wallet.
const SCHEMA_FIELD_NAMES: [&[u8]; 2] = [b"wallet_hi", b"wallet_lo"];

/// SAS `AttestationDiscriminator` — first byte of an attestation account.
pub const ATTESTATION_DISCRIMINATOR: u8 = 2;

/// The mutual's SAS credential PDA — `["credential", mutual, "members"]`.
pub fn credential_pda(mutual: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(&[CREDENTIAL_SEED, mutual.as_ref(), CREDENTIAL_NAME], &ID).0
}

/// The mutual's SAS schema PDA — `["schema", credential, "membership", [1]]`.
pub fn schema_pda(credential: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(
        &[SCHEMA_SEED, credential.as_ref(), SCHEMA_NAME, &[1]],
        &ID,
    )
    .0
}

/// A member's membership attestation PDA — the member's own key is the SAS
/// nonce, so the address is derivable from `(credential, schema, member)`
/// without any account fetch (SAS nonces are free-form; this pins ours).
pub fn attestation_pda(credential: &Pubkey, schema: &Pubkey, member: &Pubkey) -> Pubkey {
    Pubkey::find_program_address(
        &[
            ATTESTATION_SEED,
            credential.as_ref(),
            schema.as_ref(),
            member.as_ref(),
        ],
        &ID,
    )
    .0
}

/// `u32` LE length prefix + bytes (the SAS arg idiom).
fn push_bytes(data: &mut Vec<u8>, bytes: &[u8]) {
    data.extend_from_slice(&(bytes.len() as u32).to_le_bytes());
    data.extend_from_slice(bytes);
}

/// CPI `CreateCredential` (tag 0): `payer` carries rent, `authority` (the
/// mutual PDA) signs through `authority_seeds`. The credential's sole
/// authorized signer is the mutual PDA itself — attestations under it can
/// only ever come from `join`.
pub fn create_credential<'info>(
    payer: &AccountInfo<'info>,
    credential: &AccountInfo<'info>,
    authority: &AccountInfo<'info>,
    system_program: &AccountInfo<'info>,
    authority_seeds: &[&[u8]],
) -> Result<()> {
    let mut data = vec![0u8];
    push_bytes(&mut data, CREDENTIAL_NAME);
    data.extend_from_slice(&1u32.to_le_bytes());
    data.extend_from_slice(authority.key.as_ref());
    let ix = Instruction {
        program_id: ID,
        accounts: vec![
            AccountMeta::new(*payer.key, true),
            AccountMeta::new(*credential.key, false),
            AccountMeta::new_readonly(*authority.key, true),
            AccountMeta::new_readonly(*system_program.key, false),
        ],
        data,
    };
    invoke_signed(
        &ix,
        &[
            payer.clone(),
            credential.clone(),
            authority.clone(),
            system_program.clone(),
        ],
        &[authority_seeds],
    )
    .map_err(Into::into)
}

/// CPI `CreateSchema` (tag 1): `payer` carries rent, `authority` (the mutual
/// PDA) signs. Layout and field names are fixed constants — the schema is
/// part of the mutual's identity, not configuration.
pub fn create_schema<'info>(
    payer: &AccountInfo<'info>,
    authority: &AccountInfo<'info>,
    credential: &AccountInfo<'info>,
    schema: &AccountInfo<'info>,
    system_program: &AccountInfo<'info>,
    authority_seeds: &[&[u8]],
) -> Result<()> {
    let mut data = vec![1u8];
    push_bytes(&mut data, SCHEMA_NAME);
    push_bytes(&mut data, SCHEMA_DESCRIPTION);
    push_bytes(&mut data, SCHEMA_LAYOUT);
    // field_names: u32 count, then that many length-prefixed strings.
    data.extend_from_slice(&(SCHEMA_FIELD_NAMES.len() as u32).to_le_bytes());
    for name in SCHEMA_FIELD_NAMES {
        push_bytes(&mut data, name);
    }
    let ix = Instruction {
        program_id: ID,
        accounts: vec![
            AccountMeta::new(*payer.key, true),
            AccountMeta::new_readonly(*authority.key, true),
            AccountMeta::new_readonly(*credential.key, false),
            AccountMeta::new(*schema.key, false),
            AccountMeta::new_readonly(*system_program.key, false),
        ],
        data,
    };
    invoke_signed(
        &ix,
        &[
            payer.clone(),
            authority.clone(),
            credential.clone(),
            schema.clone(),
            system_program.clone(),
        ],
        &[authority_seeds],
    )
    .map_err(Into::into)
}

/// CPI `CreateAttestation` (tag 6): `payer` carries rent, `authority` (the
/// mutual PDA, a credential authorized-signer) signs. `data` is exactly the
/// member's 32-byte wallet key (schema layout `[U128, U128]`), `expiry = 0`
/// — never expires; the subaccord dies with the event instead.
pub fn create_attestation<'info>(
    payer: &AccountInfo<'info>,
    authority: &AccountInfo<'info>,
    credential: &AccountInfo<'info>,
    schema: &AccountInfo<'info>,
    attestation: &AccountInfo<'info>,
    system_program: &AccountInfo<'info>,
    authority_seeds: &[&[u8]],
    member: &Pubkey,
) -> Result<()> {
    let mut data = vec![6u8];
    data.extend_from_slice(member.as_ref());
    push_bytes(&mut data, member.as_ref());
    data.extend_from_slice(&0i64.to_le_bytes()); // expiry: never
    let ix = Instruction {
        program_id: ID,
        accounts: vec![
            AccountMeta::new(*payer.key, true),
            AccountMeta::new_readonly(*authority.key, true),
            AccountMeta::new_readonly(*credential.key, false),
            AccountMeta::new_readonly(*schema.key, false),
            AccountMeta::new(*attestation.key, false),
            AccountMeta::new_readonly(*system_program.key, false),
        ],
        data,
    };
    invoke_signed(
        &ix,
        &[
            payer.clone(),
            authority.clone(),
            credential.clone(),
            schema.clone(),
            attestation.clone(),
            system_program.clone(),
        ],
        &[authority_seeds],
    )
    .map_err(Into::into)
}
