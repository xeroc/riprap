---
# riprap-7b4e
title: CLI suite hardening + README + verify wiring
status: completed
type: task
tags:
    - ts
    - cli
created_at: 2026-09-01T23:29:35Z
updated_at: 2026-09-15T12:25:00Z
parent: riprap-pobu
blocked_by:
    - riprap-oi81
    - riprap-djgb
---

Close the CLI epic:
- Every command file carries examples + summary (help completeness pass; oclif scan warnings = failure — stale/moved command files confuse the scan, accord README notes this).
- Optional Surfpool smoke: one happy pool:init -> deposit -> spend --dry-run chain against a live validator when reachable, skip cleanly otherwise (accord env.up pattern) — the deep flows already have e2e in @riprap/tests; this lane is CLI-only wiring proof.
- README.md: run instructions (bun dev / dist), config table (flags/env/defaults incl. RIPRAP_* names), command index per topic, single-signer model + claim-payout co-signer exception.
- pnpm verify green end to end with the new apps/cli lanes (build, biome, vitest).


## Summary of Changes

- `apps/cli/src/suite.test.ts` — help completeness as an enforcing test: every non-test file under src/commands is imported (a stale/unparseable command file — the oclif scan-warning cause — fails here) and must default-export a command with non-empty `summary` + `examples`; then `node bin/run.js <id> --help` (NODE_ENV=production, dist) must exit 0 with EMPTY stderr for all 21 commands (config 2 + pool 9 + hanse 12). All 21 already carried summary+examples — zero command edits needed.
- `apps/cli/src/surfpool-smoke.test.ts` — optional live smoke (accord env.up pattern, no timers): probes `solana cluster-version` + pool-program deployment, skips cleanly when absent ($RIPRAP_SMOKE_RPC override). Live path PROVEN once against `surfpool start --offline` (auto-deployed pool.so at the canonical address): spl-token mint rig via a temp solana CLI config (spl-token 5.x takes the wallet from `-C`, not a global --keypair flag; loader requires all three keys), then pool:init (send) → pool:deposit (send, 1000 raw units rights) → pool:spend --dry-run (program id asserted). Surfpool's txtx/runbook scaffolding from the ad-hoc run was removed from the working copy.
- `apps/cli/README.md` — run instructions (bun dev vs built dist via node bin/run.js), config table (all chainFlags + env RIPRAP_RPC_URL / RIPRAP_WS_URL / RIPRAP_KEYPAIR_PATH → ANCHOR_WALLET fallback + defaults), command index per topic, offline-dry-run rules, single-signer model + the hanse:claim-payout co-signer exception.
- `pnpm verify` green end to end (105 CLI tests: +suite completeness, +smoke skip; build, biome, anchor build, cargo test).

Checklist:
- [x] help completeness + smoke green
- [x] README + verify green
