---
# riprap-da99
title: getJoinContext + buildJoinInstructions + typed errors + unit tests
status: completed
type: task
priority: normal
created_at: 2026-09-17T14:05:48Z
updated_at: 2026-09-17T19:05:50Z
parent: riprap-vol3
blocked_by:
    - riprap-hi6g
---

packages/hanse/src/join.ts per milestone HANDOFF §2/§4: pre-flight read (mutual, tiers, alreadyMember, balances, depositsOpen, canJoin/reason) + build-only instruction assembly [idempotent ATA-create, join] with guard re-runs throwing InsufficientBalance/DepositsClosed/AlreadyMember. Unit tests: derivation parity vs CLI fixtures, guard matrix, missing-ATA=0 path.

## Summary of Changes

- `packages/hanse/src/join.ts` (new, exported via `src/index.ts`): build-only join facade per milestone riprap-9ehc HANDOFF §2/§4 — `getJoinContext(rpc, {mutual, wallet})` pre-flight read (mutual account, memberAccount PDA, alreadyMember tier, cheapest-tier contribution, deposit-mint balance, SOL balance, depositsOpen, canJoin + name-stable reason union) and `buildJoinInstructions(rpc, {mutual, tier, member})` re-running every guard (DepositsClosed / TierInvalid / AlreadyMember / InsufficientBalance, each extends Error with stable `name`) and returning `[idempotent ATA-create, hanse::join]` — no blockhash/sign/send in the SDK.
- Deadlines compared in unix seconds (`Clock::unix_timestamp`), matching mutual-harness fixtures (units bug caught: Date.now() is ms).
- Missing owner ATA = balance 0n via the `getTokenAccountBalance` accountNotFound path (server-message sniff, other RPC errors rethrow so the page can render its retry state — no fake zero); mutual absent throws (no static fallback).
- `packages/hanse/src/join.test.ts` (new, 7 tests): happy-path context with vector-continuity ATA fixture (HwpBSwuy…, packages/pool token.test.ts), alreadyMember-as-state, deposits-closed, insufficient-balance (cheapest tier; middle balances still canJoin), insufficient-sol, missing-ATA=0 + rethrow, account-wiring parity of the built pair against the CLI `hanse:join` derivation (ATA program accounts, join's 13 metas incl. funder-omitted → hanse program id placeholder, tier data encoding), and the full guard matrix.
- Verification: `pnpm --filter @riprap/hanse test` 34/34 green, `tsc -b` green, `biome check src` clean, `pnpm -r run build` green, `pnpm -r run test` all lanes green (pool 11, ui 146, hanse 34, landing 20, remotion 24, cli 105, tests 10). Rust untouched (TS-only bean).
