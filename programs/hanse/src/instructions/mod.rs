//! One file per instruction (house style): the accounts struct plus its
//! `handler_*` impl holding all logic. `#[program]` bodies in `lib.rs` are
//! one-line delegates.
pub mod join;

pub mod initialize_mutual;

pub use initialize_mutual::*;
pub use join::*;
