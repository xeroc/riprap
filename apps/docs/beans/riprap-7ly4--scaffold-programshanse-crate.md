---
# riprap-7ly4
title: Scaffold programs/hanse crate
status: todo
type: task
tags:
    - rust
    - anchor
created_at: 2026-09-01T17:38:53Z
updated_at: 2026-09-01T17:38:53Z
parent: riprap-ggsd
---

Anchor 1.0.2 crate per house style:
- Cargo.toml: name hanse, cdylib+lib, features cpi/no-entrypoint/idl-build/no-log-ix-name; deps anchor-lang (init-if-needed), anchor-spl, and the cross-repo pin: accord = { git = "ssh://git@github.com/xeroc/accord.git", rev = "ba91bd8b8b374091c174909b115688ffb9b231ff", features = ["cpi"] } with a comment: rev bumps are deliberate; local override via .cargo/config [patch] for sibling-checkout workflows.
- dev-deps mirroring programs/pool (litesvm 0.10 set).
- Program keypair into target/deploy/hanse-keypair.json (solana-keygen), declare_id!, Anchor.toml [programs.localnet] hanse entry.
- lib.rs skeleton (mods + doc header citing EVENT-MUTUAL sections) that builds EMPTY — no instruction stubs, no placeholders.
- Verify cargo fetch resolves the git dep and anchor-lang versions do not fight (both 1.0.2); anchor build green.

Checklist:
- [ ] crate builds empty (anchor build + cargo check)
- [ ] git pin resolves; documented
