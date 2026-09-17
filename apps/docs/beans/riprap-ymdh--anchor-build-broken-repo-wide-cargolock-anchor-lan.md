---
# riprap-ymdh
title: 'anchor build broken repo-wide: Cargo.lock anchor-lang 1.1.2 float pulls edition2024 block-buffer past SBF cargo 1.84 — pin anchor =1.0.2 or bump SBF platform-tools'
status: draft
type: task
created_at: 2026-09-17T18:38:16Z
updated_at: 2026-09-17T18:38:16Z
---

## Evidence (2026-09-17, discovered during riprap-hi6g)

- `pnpm verify` legs `anchor build` + `cargo test` fail in riprap-vol3 AND in the untouched main `../riprap` worktree — pre-existing, not bean-specific.
- Root cause chain: `programs/*/Cargo.toml` say `anchor-lang = "1.0.2"` (`^`), `Cargo.lock` resolved **anchor-lang/anchor-spl/anchor-syn 1.1.2** → `sha2 0.11` → `digest 0.11.3` → **`block-buffer 0.12.1` declares `edition2024`**. `cargo build-sbf` (solana 3.0.13 active_release) runs rustup toolchain `1.84.1-sbpf-solana-v1.51` = **cargo 1.84, edition2024 stabilized only in 1.85** → manifest parse fails for both programs.
- `anchor idl build` then also fails: it compiles test targets, and `programs/{pool,hanse}/tests` `include_bytes!("target/deploy/pool.so")` — pool.so is never produced (hanse.so in target/deploy is a stale fingerprint artifact from an earlier build).
- `../riprap/target/deploy/pool.so` was built 2026-09-17 11:34 with the same lock, so the machine could build it earlier that day; the `1.84.1-sbpf-solana-v1.51` toolchain dir was (re)written at 20:34 the same evening — toolchain state drift suspected but not fully reconstructed.
- Stray `programs/pool/target/deploy/pool-keypair.json` (H7xW…) made `anchor build -p pool` additionally report a program-ID mismatch; the junk nested `programs/pool/target` was deleted (committed keypairs: pool 63Ev…, hanse DTSw…).

## Candidate fixes (human decision — Rust dep pin is out of milestone scope)

1. Pin `anchor-lang`/`anchor-spl` (and hanse's `accord`-adjacent anchor pins) to `=1.0.2`, `cargo update` the lock back under 1.0.2, verify `anchor build` + `cargo test` + e2e. Matches the documented toolchain contract (Anchor CLI 1.0.2, AGENTS.md).
2. Or bump the SBF platform-tools / solana release so cargo-build-sbf uses cargo ≥1.85 (machine-global change).

