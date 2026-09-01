---
# riprap-uzru
title: Update AGENTS.md completion gate and verify wiring
status: completed
type: task
priority: normal
created_at: 2026-09-01T05:12:51Z
updated_at: 2026-09-01T07:11:38Z
parent: riprap-rdv8
blocked_by:
    - riprap-06s2
---

## Summary of Changes

- `package.json`: `verify` script extended to `pnpm -r run build && pnpm lint && pnpm -r run test && anchor build && cargo test` — gate entry point stays `pnpm verify`, now covers the on-chain half (milestone DoD §5 item 3). Root `description` updated to name `programs/pool` + `@riprap/pool` alongside the frontend packages.
- `AGENTS.md`: Project Overview reworded (frontend + on-chain halves, Rust 1.89 / Anchor 1.0.2, "no web2 backend"); Setup Commands note the pinned Rust toolchain and `avm` anchor-cli required by the gate; Completion Gate command block now includes `anchor build && cargo test` plus the codegen follow-up rule (`anchor build` regenerates gitignored `target/idl/pool.json` → re-run `pnpm --filter @riprap/pool codegen` and commit the client with the program change); Testing Instructions gain the `cargo test` line (16 unit + 5 LiteSVM lifecycle tests, no validator).
- Verified: `pnpm verify` exit 0 from repo root with the new chain — JS builds, Biome lint, all Vitest suites, `anchor build` (IDL regenerated, ignored), `cargo test` 21/21 green.
