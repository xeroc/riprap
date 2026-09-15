---
# riprap-4ma4
title: Scaffold @riprap/tests jest + Surfpool harness
status: completed
type: task
tags:
    - ts
    - e2e
created_at: 2026-09-01T17:39:46Z
updated_at: 2026-09-01T17:39:46Z
parent: riprap-oaa8
blocked_by:
    - riprap-dw6d
---

Repo-root tests/ package, harness ported from accord tests/src/setup:
- pnpm-workspace.yaml += tests/*; @riprap/tests with jest + ts-jest ESM (NODE_OPTIONS=--experimental-vm-modules), maxWorkers 1 (global time-warp — warps computed from live clock), deps: @solana/kit, @solana/spl-token, @riprap/hanse, @riprap/pool, @useaccord/sdk@0.1.0 (npm), bn.js.
- Port env.ts (createTestEnv, env.up probe -> specs skip cleanly when no validator, sendIx, fundSigner; RPC 127.0.0.1:8899 overridable), cheats.ts (surfnet_timeTravel, surfnet_setAccount), vrf.ts idea stub NOT needed here — vrf injection is draw-harness scope (next bean).
- Program deploy helper: anchor test deploys workspace programs (pool, hanse); deploy accord.so in beforeAll from env ACCORD_SO default ../../accord/target/deploy/accord.so via loader transactions; typed failure pointing at the sibling repo when absent.
- USDC-like 6dp mint + minter.
- Anchor.toml [scripts] test -> jest runner (accord pairing); pnpm verify stays green offline (skip path).

Checklist:
- [x] harness boots on Surfpool: env probe, deploys, mint
- [x] offline skip proven (pnpm verify)

## Summary of Changes

- `tests/` — new `@riprap/tests` package: jest + ts-jest ESM (`NODE_OPTIONS=--experimental-vm-modules`, `maxWorkers: 1` — global time-warp), deps `@solana/kit`, `@solana/spl-token`, `@riprap/hanse`, `@riprap/pool`, `@useaccord/sdk@0.1.0` (npm), `bn.js`. Workspace glob is plain `tests` (`tests/*` matches subdirectories, not the package root).
- `tests/src/setup/env.ts` — ported from accord: `createTestEnv` (probe → skip, payer load only when up so keypair-less machines still skip cleanly), `sendIx` + `sendIxs` (multi-ix txs; `{ blockhash, skipConfirm }` options for deploy batching), `fundSigner`, pool/hanse deployed-checks with `anchor test` hint, env prefix `RIPRAP_RPC_URL`/`RIPRAP_WS_URL`/`RIPRAP_PAYER_PATH`.
- `tests/src/setup/cheats.ts`, `tokens.ts` — verbatim ports (`surfnet_timeTravel`/`setAccount`/`setTokenAccount`, clock warps; hand-encoded 82-B mint, USDC-like 6-dp default, `setTokenBalance`, `ataOf`).
- `tests/src/setup/deploy.ts` — BPF Upgradeable Loader deploy for accord.so: `ensureAccordProgram` idempotent (skip when the account exists), reads `ACCORD_SO` + `ACCORD_KEYPAIR` defaulting into `../accord/target/deploy/`, `MissingAccordBuildError` typed failure pointing at the sibling repo. Encodings verified against solana-bpf-loader-program 3.1.14 (bincode fixint u32 tag / u64 len; buffer 37 B meta, programdata 45 B PDA, program 36 B). System Allocate rule ⇒ buffer and program keypairs sign their CreateAccount. 1000-B Write chunks (1232-B tx budget), 64-batch fire-and-forget sends sharing a blockhash, buffer-length poll + Deploy's ELF verify as backstop (789 writes ≈ 1.4 s under anchor's surfnet; ~23 s worst case standalone).
- `txtx.yml` + `runbooks/deployment/` — port of the accord runbook pairing: `anchor test` starts Surfpool, which auto-deploys pool + hanse (`instant_surfnet_deployment`) before the jest runner fires.
- `Anchor.toml` `[scripts] test = "pnpm --filter @riprap/tests test"`; `pnpm-workspace.yaml` += `tests` + `allowBuilds` for bigint-buffer/bufferutil/utf-8-validate (jest native accelerators; pnpm 11 blocked their builds); `.gitignore` += `.surfpool`.
- Verification: `anchor test --skip-build` exit 0 online (env probe, runbook deploys, accord.so deploy, 6-dp mint + balance readback, `surfnet_timeTravel` warp; idempotent re-run 78 ms); offline `pnpm --filter @riprap/tests test` skips clean; full `pnpm verify` exit 0.
- Ops note (pre-existing, not fixed here): on a fresh tree `anchor build` fails until `target/deploy/{pool,hanse}.so` exist — hanse's tests `include_bytes!` both; bootstrap with `cargo build-sbf --tools-version v1.52` (block-buffer 0.12.1's re-normalized manifest needs cargo ≥ 1.85; CLI 3.0.13 bundles v1.51), then `anchor build`.
