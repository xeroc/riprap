---
# riprap-hi6g
title: Move ATA derivation + SPL ids into @riprap/pool
status: completed
type: task
created_at: 2026-09-17T14:05:48Z
updated_at: 2026-09-17T18:40:00Z
parent: riprap-vol3
---


## Summary of Changes

- `packages/pool/src/token.ts` (new): `findAssociatedTokenAddress(mint, owner)` (same argument order + derivation layout as the CLI lib it replaced) + re-exports `TOKEN_PROGRAM_ADDRESS`, `ASSOCIATED_TOKEN_PROGRAM_ADDRESS`, `getCreateAssociatedTokenIdempotentInstruction(Async)` from `@solana-program/token@^0.15.0` (the kit-v7-paired release; the ATA program client ships inside it — no separate `@solana-program/associated-token` package exists on npm, that name 404s).
- `packages/pool/src/token.test.ts` (new): program-id asserts + ATA vector continuity test (devnet-USDC × fixed owner → `HwpBSwuyVKJi7d9kqqNexc54MS9i4BEDKDVDLeUVjZm8`, computed with the old hand-rolled derivation before deletion).
- `packages/pool/package.json`: dep `@solana-program/token` (pnpm resolved the kit-7-consistent subtree, incl. `@solana-program/system@0.13.0`).
- `packages/hanse/src/index.ts`: named re-export of the token surface from `@riprap/pool` (join-facade seam for sibling bean riprap-da99).
- `apps/cli/src/lib/token.ts` deleted; all 19 importers migrated to `@riprap/pool`; `AGENTS.md` SDK-facades map row updated.
- Verification: `pnpm -r run build`, `pnpm lint` (0 errors), `pnpm -r run test` (328 tests incl. CLI 105) all green. `pnpm verify` legs `anchor build`/`cargo test` fail PRE-EXISTING repo-wide (anchor-lang 1.1.2 lock float vs SBF cargo 1.84) — reproduced in the untouched `../riprap` worktree; filed as draft bean riprap-ymdh. Also fixed 3 pre-existing biome format errors (remotion tweets.ts, tests setup deploy.ts/env.ts) so the lint leg is green.

Relocate findAssociatedTokenAddress + TOKEN_PROGRAM_ADDRESS + ASSOCIATED_TOKEN_PROGRAM_ADDRESS from apps/cli/src/lib/token.ts to packages/pool (new @solana-program/token + @solana-program/associated-token deps for derivation + idempotent create-ix builder); re-export via @riprap/hanse; migrate CLI imports. pnpm -r build green.
