---
# riprap-15tk
title: Scaffold Anchor workspace and pool crate
status: completed
type: task
priority: normal
created_at: 2026-09-01T05:12:50Z
updated_at: 2026-09-01T05:17:06Z
parent: riprap-4uzk
---


## Summary of Changes

- Scaffolded Anchor 1.0.2 workspace at repo root via `anchor init` (temp dir, files harvested): root `Cargo.toml` (members `programs/*`, release profile `overflow-checks = true` per milestone handoff), `Anchor.toml` (localnet, `test = "cargo test"`), `rust-toolchain.toml` (1.89.0, matches installed sbpf toolchain).
- `programs/pool` crate `pool`: `anchor-lang = "1.0.2"` + litesvm/solana 3.x dev-deps (ready for riprap-mvoa), empty `#[program]` shell with `declare_id!("63EvHuWaMRSZhD9EPXd7UeW5YFFv41GQUHpv7LpY6wm1")`.
- Committed `target/deploy/pool-keypair.json` (with `.gitignore` negation chain) so the program id is stable across herdr worktrees — sibling beans build against the same declared id.
- Repo wiring the scaffold exposed: resolved the `allowBuilds` placeholder in `pnpm-workspace.yaml` (`esbuild: true`, the pnpm 11 mechanism — `onlyBuiltDependencies` was not honored; `pnpm verify` was red before this), and excluded `target/**` from Biome so the keypair stays byte-identical to anchor's output.
- Verified: `anchor build` exit 0 (pool.so + target/idl/pool.json), `cargo test` exit 0, `pnpm verify` exit 0 (2 pre-existing warnings in WorkedExampleBand.tsx unchanged).
