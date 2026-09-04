---
# riprap-vrzq
title: Hanse SDK PDA + fetch helpers with tests
status: completed
type: task
tags:
    - ts
    - tdd
created_at: 2026-09-01T17:39:46Z
updated_at: 2026-09-01T17:39:46Z
parent: riprap-bkxy
blocked_by:
    - riprap-dw6d
---

packages/hanse/src mirroring packages/pool/src:
- pdas.ts: mutualPda [mutual, seed le], memberPda, claimPda, authority PDAs [mutual_auth, mutual] / [mutual_own, mutual], fee float ATA; pool-side passthroughs the e2e needs (treasury, depositor).
- fetch.ts: fetchMutual / fetchMember / fetchClaim decoded getters over the generated accounts tree.
- vitest colocated (pool test style): PDA vectors match the on-chain seeds EXACTLY (pin vectors; assert stability); fetch tests follow the pool fetch.test.ts pattern.
- NO tier table constant in the SDK — data law: prices live on-chain (Mutual.tiers) and in packages/ui lib/poolMath.ts only.

## Summary of Changes

- `src/pdas.ts`: hand-written `findMutualPda` (["mutual", seed le u64] — codama can't emit it, the seed is an instruction arg; mirrors pool's `findPoolPda`), `findFeeFloatPda` (ATA layout verified against the spl-associated-token-account 2.3.0 crate source: seeds [owner, Tokenkeg… token program, mint] under ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL), re-exports of the generated member/claim/mutual_auth/mutual_own PDA helpers, and pool-side passthroughs (`findPoolPda`, `findDepositorPda`) via a new `@riprap/pool` `workspace:*` dependency.
- `src/fetch.ts`: `fetch{Mutual,Member,Claim}` + `fetchMaybe*` wrappers (by seed / by owner / by nonce) over the generated accounts tree, pool-style.
- 19 vitest tests (TDD red first): PDA vectors vs manual seed-layout derivations incl. stability + program-address/ATA-program overrides; fetch tests on a structural rpc mock (decode happy paths, missing-account throw, `exists:false`). No tier table constant — fixtures deliberately use arbitrary 1n..9n values, not the policy prices.
- `test` script aligned back to plain `vitest run` (the `--passWithNoTests` from riprap-dw6d dropped now that tests exist).
- Also fixed pre-existing root-lint errors: `useLiteralKeys` ×2 in pool's generated `errors/pool.ts` (red before this change) and ×2 in hanse's generated `errors/hanse.ts` (codegen's safe-write skips them; applied the fix).
- Verified: `pnpm -r run build` exit 0, `pnpm lint` exit 0 (23 warnings — codama's standard generated-code diagnostics), `pnpm test` exit 0 (hanse 19, pool 9, ui 101, landing 20).

Checklist:
- [x] helpers + green tests
- [x] lint clean
