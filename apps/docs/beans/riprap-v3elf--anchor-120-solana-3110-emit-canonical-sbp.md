---
# riprap-v3elf
title: anchor 1.2.0 + solana 3.1.10 emit canonical sBPFv3 ELFs that litesvm 0.10 cannot load — Rust test lane needs the litesvm 0.16 port
status: todo
type: bug
priority: high
tags:
    - toolchain
    - litesvm
    - tests
created_at: 2026-09-24T00:00:00Z
updated_at: 2026-09-24T00:00:00Z
---

`anchor build` (anchor-cli 1.2.0, verified via strace) invokes `cargo-build-sbf --tools-version v1.57 --arch v3`. The resulting canonical sBPFv3 ELF does not load in `litesvm 0.10` (`add_program` → `Instruction(InvalidAccountData)`), so the completion gate's `anchor build && cargo test` order breaks on any machine with current platform-tools: the anchor-built `target/deploy/*.so` replace whatever the tests could load. Previously-green state relied on stale artifacts built by an older platform-tools emitting a loadable shape.

The sibling accord repo hit and fixed the same thing (their Cargo.toml comment + bean accord-jhzr): "only the agave-4 line loads the canonical sBPFv3 ELF the v1.57 sbpfv3 target emits (agave 3.1.x's sbpf expects a transitional v3 shape no toolchain produces)". They vendored anchor-litesvm retargeted to litesvm 0.16 (agave 4.2 / sbpf 0.21): git `xeroc/anchor-litesvm` branch `litesvm-0.16-sbpfv3`.

What the port needs here (riprap's Rust tests use raw `litesvm`, not anchor-litesvm):

- Bump `litesvm` dev-dep 0.10 → 0.16 in `programs/{pool,hanse}`. That pulls the agave-4 line (solana-message 4.x / solana-transaction 4.x …), so the test plumbing's transaction/signer types move with it; `anchor_lang::solana_program` (3.x) `Instruction`s need a boundary conversion in `common/mod.rs`-style harnesses.
- After the port, defaults work again: no sibling v0 rebuilds, no `ACCORD_SO` pin juggling, and the SAS `.so` (default-arch v0 build) must be verified to load under litesvm 0.16 too — if not, build it with matching arch.

Workaround used until the port lands (riprap-7wa9 verification): build pool/hanse with plain `cargo build-sbf` (default `--arch v0`, loadable) and run `cargo test` with `ACCORD_SO` pointing at a v0 build of accord from the PINNED rev `ba91bd8` (the sibling checkout's HEAD build also carries economics changes — `FeeDominatesSlash` — that the pin's fixtures don't satisfy). Canonical program keypairs live in the sibling `Accord/riprap/target/deploy` if `target/deploy` here is ever clobbered.
