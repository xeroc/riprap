//! One file per instruction (house style): the accounts struct plus its
//! `handler_*` impl holding all logic. `#[program]` bodies in `lib.rs` are
//! one-line delegates.
pub mod file_claim;
pub mod join;
pub mod settle_claim;

pub mod initialize_mutual;

pub use file_claim::*;
pub use initialize_mutual::*;
pub use join::*;
pub use settle_claim::*;
