---
# riprap-06s2
title: PDA and fetch helpers with vitest
status: completed
type: task
created_at: 2026-09-01T05:12:51Z
updated_at: 2026-09-01T05:12:51Z
parent: riprap-2eea
blocked_by:
    - riprap-k2e0
---

## Summary of Changes

- `src/pdas.ts`: hand-written `findPoolPda({ seed })` — Anchor/codama cannot emit this helper because the seed is an instruction argument, not an account. Seeds `["pool", seed le u64]` per handoff §2 (kit's `getU64Encoder` is LE, matching Rust's `to_le_bytes`). Re-exports the generated `findDepositorPda`.
- `src/fetch.ts`: seed/owner-composed fetch helpers — `fetchPoolBySeed` / `fetchMaybePoolBySeed` (derive PDA then fetch) and `fetchDepositorByOwner` / `fetchMaybeDepositorByOwner`, typed against `Rpc<SolanaRpcApi>` like the generated fetches.
- `src/index.ts` becomes the package entry (re-exports generated root + helpers); package.json exports/tsconfig include updated; `test: vitest run` added to the gate.
- Tests (9, vitest node env): PDA seed-layout and determinism against manual `getProgramDerivedAddress` constructions (pool seed 0/719, distinct seeds, program-id override, depositor b"depositor"+pool+owner base58 layout); fetch helpers verified with a structural rpc mock — `fetchPoolBySeed` queries exactly the `findPoolPda` address and round-trips a `getPoolEncoder`-encoded account (state/mint/rates/seed decoded), missing accounts throw for fetch* and return `exists:false` with the derived address for fetchMaybe*.
- Verified: `pnpm verify` exit 0 repo-wide; pool contributes build (tsc -b) + 9 tests to the gate; lint 0 errors (warnings: 8 codama-generated + 2 pre-existing ui).


