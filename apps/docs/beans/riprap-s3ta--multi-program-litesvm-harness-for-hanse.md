---
# riprap-s3ta
title: Multi-program LiteSVM harness for hanse
status: todo
type: task
tags:
    - rust
    - tdd
created_at: 2026-09-01T17:38:53Z
updated_at: 2026-09-01T17:38:53Z
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
- [ ] env boots all three programs + mint
- [ ] clock warp + dispute fabrication helpers proven by one smoke test each
