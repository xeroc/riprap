//! One file per instruction (house style): the accounts struct plus its
//! `handler_*` impl holding all logic. `#[program]` bodies in `lib.rs` are
//! one-line delegates.
pub mod claim_payout;
pub mod file_claim;
pub mod join;
pub mod set_subaccord_param;
pub mod settle_claim;
pub mod settle_pool;

pub mod initialize_mutual;

pub use claim_payout::*;
pub use file_claim::*;
pub use initialize_mutual::*;
pub use join::*;
pub use set_subaccord_param::*;
pub use settle_claim::*;
pub use settle_pool::*;
