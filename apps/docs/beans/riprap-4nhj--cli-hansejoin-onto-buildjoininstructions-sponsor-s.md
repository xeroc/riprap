---
# riprap-4nhj
title: CLI hanse:join onto buildJoinInstructions (sponsor stays local)
status: completed
type: task
created_at: 2026-09-17T14:05:48Z
updated_at: 2026-09-17T21:30:00Z
parent: riprap-vol3
blocked_by:
    - riprap-da99
---

apps/cli join command consumes the facade for the self-pay path; --sponsor keeps its own assembly until the facade grows a funder param. hanse build tests + help suite stay green; README dry-run matrix unchanged.

## Summary of Changes

- `apps/cli/src/commands/hanse/join.ts`: self-pay live joins (no `--sponsor`, no `--dry-run`, no `--pool`/`--deposit-mint` overrides) now build through `buildJoinInstructions` from `@riprap/hanse` — facade guard re-runs (DepositsClosed/AlreadyMember/InsufficientBalance) + idempotent ATA-create prepended, one transaction, one signature; `memberAccount` PDA derived once for the unchanged `emitSend` payload. `--sponsor`, `--dry-run`, and offline overrides keep the exact local assembly (README dry-run matrix unchanged).
- `apps/cli/src/lib/base-command.ts`: `sendInstruction` widened to `Instruction | Instruction[]` — arrays append into the same single v0 transaction (single-signer model holds: facade path signs only with the member wallet).
- `packages/hanse/src/join.ts`: facade rpc param is now the minimal structural `Rpc<GetAccountInfoApi & GetBalanceApi & GetTokenAccountBalanceApi>` — admits both the accord-app `Rpc<SolanaRpcApi>` convention and the CLI's `createSolanaRpc` union, no casts at either consumer; `packages/hanse/src/fetch.ts` helpers widened to `Rpc<GetAccountInfoApi>` (the generated clients' own idiom — source-compatible widening for every existing caller).
- Environment repair (pre-existing, not caused by this change): `target/deploy/pool.so` was missing after a sibling build rotated `pool-keypair.json`; restored via `anchor build -p pool --ignore-keys`, then full `anchor build --ignore-keys`. NOTE for the fleet: `target/deploy/{pool,hanse}-keypair.json` are regenerated random keypairs ≠ the pinned program ids (`63EvHu…`, `DTSwUu…`) — live e2e deploy needs the original keypairs restored from a backup; LiteSVM suites and `cargo test` are unaffected (they embed the ELF's declared id).
- Verification: `pnpm -r run build` green, `pnpm -r run test` all lanes green (cli 105/105 incl. both `hanse:join --dry-run` snapshots + help suite), biome clean on touched packages, `anchor build --ignore-keys` green (pool + hanse tests run inside the build), `cargo test` 15/15 suites ok.
