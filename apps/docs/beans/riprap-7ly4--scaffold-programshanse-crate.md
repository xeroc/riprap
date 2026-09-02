---
# riprap-7ly4
title: Scaffold programs/hanse crate
status: completed
type: task
tags:
    - rust
    - anchor
created_at: 2026-09-01T17:38:53Z
updated_at: 2026-09-02T01:55:00Z
parent: riprap-ggsd
---

Anchor 1.0.2 crate per house style:
- Cargo.toml: name hanse, cdylib+lib, features cpi/no-entrypoint/idl-build/no-log-ix-name; deps anchor-lang (init-if-needed), anchor-spl, and the cross-repo pin: accord = { git = "ssh://git@github.com/xeroc/accord.git", rev = "ba91bd8b8b374091c174909b115688ffb9b231ff", features = ["cpi"] } with a comment: rev bumps are deliberate; local override via .cargo/config [patch] for sibling-checkout workflows.
- dev-deps mirroring programs/pool (litesvm 0.10 set).
- Program keypair into target/deploy/hanse-keypair.json (solana-keygen), declare_id!, Anchor.toml [programs.localnet] hanse entry.
- lib.rs skeleton (mods + doc header citing EVENT-MUTUAL sections) that builds EMPTY — no instruction stubs, no placeholders.
- Verify cargo fetch resolves the git dep and anchor-lang versions do not fight (both 1.0.2); anchor build green.

Checklist:
- [x] crate builds empty (anchor build + cargo check)
- [x] git pin resolves; documented

## Summary of Changes

- `programs/hanse/Cargo.toml`: anchor 1.0.2-floor crate (cdylib+lib, full anchor feature set, `init-if-needed`), dev-deps mirroring `programs/pool` (litesvm 0.10 set), accord pinned to rev `ba91bd8` with the deliberate-rev / `[patch]`-override comment.
- `programs/hanse/src/lib.rs`: doc header citing EVENT-MUTUAL §2.2–§2.7 + layout law; empty `error`/`events`/`instructions`/`state` mods; `declare_id!("DTSwUuWC1SpZP8LcJ1EJ4HtUxAczqwrsgqNYnR1QXK3p")`; empty `#[program] mod hanse` — no stubs.
- Keypair at `target/deploy/hanse-keypair.json` (gitignore whitelist added), `Anchor.toml [programs.localnet] hanse` entry.
- Lock resolution findings (documented in Cargo.toml comments):
  - accord rev requires anchor-lang **1.1.x** at compile time (`anchor_lang::__private` moved) — workspace lock unifies anchor-lang/anchor-spl to 1.1.2; pool+hanse+accord all green on it.
  - `ephemeral-rollups-sdk` (accord transitive) pins `base64ct =1.6.0` — locked down from 1.8.3.
  - `five8 1.0.0` must stay wired to `five8_core 1.0.0` in Cargo.lock (resolver can reuse 0.1.2 from ephemeral's five8 0.2.1 tree, breaking solana-keypair E0277) — edge pinned in lock, landmine documented.
- Verified: `pnpm verify` exit 0 (includes `anchor build` + `cargo test`); `cargo fetch` resolves the git pin over SSH.
