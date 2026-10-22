---
# riprap-q37t
title: 'Test pilot-gate retirement: third-party cranker + reconciler matrix'
status: completed
type: task
assigned: tester
priority: high
created_at: 2026-10-15T08:01:18Z
updated_at: 2026-10-15T14:45:00Z
parent: riprap-hxed
blocked_by:
    - riprap-20to
---

Red-green on the retirement change:
- [x] New LiteSVM test: claim_payout executes with cranker key != mutual.authority (replaces the old rejection test — replaced, not deleted)
- [x] Reconciler decision matrix: authority column removed; non-authority daemon emits claim_payout for settled mutuals in the pull window
- [x] Full `pnpm verify` exit 0 (programs change — Rust legs included)

## Summary of Changes

- LiteSVM third-party-cranker coverage landed with the retirement change (riprap-20to): `non_authority_cranker_pays_claimant` (claim_payout suite — asserts the §8 $2,015 payout lands in the claimant ATA + Paid status under a stranger key) and security row S1 flipped to assert permissionless success; the old `non_authority_cranker_reverts` was replaced, not deleted.
- Reconciler matrix (this change): the mutual fixture's `authority` override column removed (encoder pins AUTHORITY directly — no test reads it anymore), the header state-machine sketch states the permissionless crank, and the Settled tests assert a STRANGER daemon dispatches claim_payout inside the pull window (flipped in riprap-20to; suite 23/23 green here).
- Full gate: `pnpm verify` exit 0 (build, lint 0 errors, all TS suites, `anchor build --arch v2`, `cargo test` — 1089s). Bare `cargo test` passes because the sibling `../accord/target/deploy/accord.so` is pinned to its sBPFv1 build (Sep 26, develop-era — matches the suite's behavior expectations and loads in litesvm 0.10); the sibling's `make build` emits canonical sBPFv3 that litesvm 0.10 rejects (tracked: riprap-v3elf / riprap-0udy / riprap-h2pd). Live e2e is unaffected — the jest harness prefers the checked-in `tests/deps/accord.so`.
- Changeset: `.changeset/reconciler-matrix-permissionless.md` (patch, @riprap/cranker).
