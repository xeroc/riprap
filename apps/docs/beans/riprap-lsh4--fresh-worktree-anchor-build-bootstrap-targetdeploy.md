---
# riprap-lsh4
title: 'Fresh-worktree anchor build bootstrap: target/deploy keypairs + pool.so chicken-and-egg'
status: draft
type: task
created_at: 2026-09-22T18:46:51Z
updated_at: 2026-09-22T18:46:51Z
---

First anchor build in a worktree with empty target/ fails: the IDL phase compiles hanse test crates whose include_bytes target/deploy/pool.so needs an artifact anchor emits only later; also target/deploy/*-keypair.json (gitignored) must match the declared vanity ids or the key check aborts. Bootstrapped manually in riprap-v7xe by seeding from the default workspace. Candidate fixes: commit the keypairs for the localnet-only programs, or make the test harness fall back to building pool.so, or document the seeding step in AGENTS.md Setup.
