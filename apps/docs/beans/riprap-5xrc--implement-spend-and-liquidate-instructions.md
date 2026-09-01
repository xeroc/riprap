---
# riprap-5xrc
title: Implement spend and liquidate instructions
status: completed
type: task
created_at: 2026-09-01T05:12:51Z
updated_at: 2026-09-01T05:12:51Z
parent: riprap-4uzk
blocked_by:
    - riprap-e6xm
---


## Summary of Changes

- `instructions/spend.rs`: door one — rights-authority signer checked against `pool.rights_authority`, pool must be Open, treasury→destination transfer signed by the pool PDA (`CpiContext::new_with_signer`); `Spent` event. Destination is any token account of the pool's mint (push payouts per ADR-0001).
- `instructions/liquidate.rs`: door two — ownership-authority signer, Open→Liquidated, terminal; `Liquidated` event.
- **Pool state gains `seed: u64` + `bump: u8`** (handoff §2 deviation, deliberate): the treasury ATA's authority is the pool PDA, so every outbound transfer needs the PDA's signer seeds at spend/crank time, and the handoff ix signatures (`spend(amount, destination)`, `liquidate()`) carry no seed. Space test updated (INIT_SPACE 169→178).
- Treasury binding hardened in deposit + spend: `associated_token::mint = pool.mint, associated_token::authority = pool` — the treasury must be THE passed pool's canonical ATA, killing any cross-pool treasury confusion.
- No inline unit tests added: this bean's matrix rows (non-authority revert, Liquidated revert) are anchor-constraint behavior exercised by mvoa's LiteSVM suite.
- Verified: `anchor build` 0, `cargo test` 11 passed, `cargo clippy --all-targets` 0 warnings, `pnpm verify` 0. IDL: deposit/init/liquidate/spend + Deposit/Spent/Liquidated.
