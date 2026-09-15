---
# riprap-ngb0
title: Update AGENTS.md and README for hanse
status: completed
type: task
priority: normal
tags:
    - docs
created_at: 2026-09-01T17:40:03Z
updated_at: 2026-09-01T23:29:35Z
parent: riprap-6vc7
blocked_by:
    - riprap-c448
    - riprap-6ph7
    - riprap-7b4e
---

Repo docs kept truthful (docs or same-commit as final wiring, never silently stale):
- AGENTS.md: overview += programs/hanse + @riprap/hanse + @riprap/tests; completion gate note (jest e2e lane, offline skip); test prerequisites: sibling accord checkout built (ACCORD_SO) + the accord git rev pin documented.
- README workspace map.
- Confirm pnpm verify text matches what verify actually runs.

Checklist:
- [x] docs updated
- [x] pnpm verify green end-to-end
Also cover apps/cli (@riprap/cli): workspace map entry, config env names (RIPRAP_*), single-signer + claim-payout co-signer note.

## Summary of Changes

- AGENTS.md: overview now names both halves (frontend; `programs/pool` + `programs/hanse` with their Codama clients, `apps/cli`, `tests`); added `meta/specs/EVENT-MUTUAL.md` to the doc law; completion gate documents the jest e2e lane (offline skip via validator probe, `anchor test` for a live run), the live-e2e prerequisites (sibling accord build / `ACCORD_SO`/`ACCORD_KEYPAIR`, accord rev pin `ba91bd8b…` in `programs/hanse/Cargo.toml`), and dual IDL/codegen for pool + hanse; Testing Instructions gained `@riprap/tests` and `@riprap/cli` bullets.
- README.md: title/intro/Key Features cover the on-chain half, CLI, and e2e; `pnpm verify` text now matches the actual script (build → lint → test → `anchor build` → `cargo test`, cargo-style expected tail); Prerequisites add Rust/Anchor (+ sibling accord for live e2e); directory structure and Repository Map gained programs/, packages/pool|hanse, apps/cli, apps/docs, tests/, meta/specs; Environment Variables section lists the real `RIPRAP_*`/`ACCORD_*` names with localnet defaults (was "None"); scripts table adds `anchor test` + CLI dev.
- apps/cli coverage: workspace-map rows (root + README Repository Map), env names table (`RIPRAP_RPC_URL`/`RIPRAP_WS_URL`/`RIPRAP_KEYPAIR_PATH`/`RIPRAP_PAYER_PATH`/`RIPRAP_SMOKE_RPC`/`ACCORD_SO`/`ACCORD_KEYPAIR`), single-signer + `hanse:claim-payout` `--co-signer` note in AGENTS overview, Key Features, and Repository Map.
