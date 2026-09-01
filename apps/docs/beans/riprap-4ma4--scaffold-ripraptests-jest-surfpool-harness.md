---
# riprap-4ma4
title: Scaffold @riprap/tests jest + Surfpool harness
status: todo
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
- [ ] harness boots on Surfpool: env probe, deploys, mint
- [ ] offline skip proven (pnpm verify)
