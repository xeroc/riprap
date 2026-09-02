---
# riprap-s3ta
title: Multi-program LiteSVM harness for hanse
status: completed
type: task
tags:
    - rust
    - tdd
created_at: 2026-09-01T17:38:53Z
updated_at: 2026-09-02T02:45:00Z
parent: riprap-ggsd
blocked_by:
    - riprap-7ly4
---

tests/ harness under programs/hanse (pool lifecycle.rs Env pattern, extended):
- Load target/deploy/hanse.so + pool.so + the accord binary. accord.so is NOT in this repo: fs::read at runtime, path from env ACCORD_SO default ../../accord/target/deploy/accord.so (relative to CARGO_MANIFEST_DIR); typed error pointing at the sibling repo when missing.
- 6-decimal USDC-style mint (create_account + initialize_mint2), ATA helpers, airdrops, send() tx helper.
- Clock warp helper (svm.set_sysvar Clock) for deposits/claims deadlines and windows.
- PDA helpers: mutual/member/claim/mutual_auth/mutual_own + pool treasury/depositor + accord dispute.
- Dispute-state fabrication for settle_claim tests: after a real file_claim, overwrite the Dispute account to terminal states (Final + final_ruling index, or Failed) — precedent: accord accumulator_litesvm inject_vrf_freeze. No voting flows here (those live in the TS e2e).

Checklist:
- [x] env boots all three programs + mint
- [x] clock warp + dispute fabrication helpers proven by one smoke test each

## Summary of Changes

- `tests/common/mod.rs` — shared harness (pool lifecycle.rs Env pattern): boots pool+hanse+accord, 6-decimal mint, payer airdrop; `send`/`try_send`/`create_account`/`token_amount`/`ata` helpers; `warp_clock`; PDA helpers (mutual/member/claim/mutual_auth/mutual_own, pool/treasury/depositor, accord `dispute_pda`); dispute fabrication `plant_dispute`/`force_final`/`force_failed`/`read_dispute` + `base_dispute` ctor (accord inject_vrf_freeze precedent); `assert_custom_err` for HanseError.
- `tests/harness_smoke.rs` — 4 smoke tests: three-program boot + mint decimals, typed missing-binary error (names path + ACCORD_SO override), clock warp, dispute terminal-state round-trip (owner = accord program).
- Deviations from the bean text, deliberate:
  - default accord path is `CARGO_MANIFEST_DIR/../../../accord/target/deploy/accord.so` — the bean's `../../` resolves to the repo root, not the sibling parent; this machine's layout (Accord/accord at pinned rev ba91bd8, program id matches the crate) is what the default now targets. `ACCORD_SO` still overrides.
  - `plant_dispute`/`base_dispute` added so fabrication is provable before file_claim exists; force_* mutate real filed disputes as specced.
- Build mechanics: dev-deps `solana-account`/`solana-clock` major-matched to litesvm 0.10 (3.x), `pool` + self dev-deps carry `no-entrypoint` (two SBF entrypoints cannot link into one host test binary); `#![allow(dead_code)]` on helpers awaiting sibling instruction beans.
- Verified: `cargo test -p hanse` 12/12 (8 state + 4 smoke), clippy zero warnings, `pnpm verify` exit 0.
