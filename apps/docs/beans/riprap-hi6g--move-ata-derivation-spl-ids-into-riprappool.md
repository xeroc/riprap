---
# riprap-hi6g
title: Move ATA derivation + SPL ids into @riprap/pool
status: todo
type: task
created_at: 2026-09-17T14:05:48Z
updated_at: 2026-09-17T14:05:48Z
parent: riprap-vol3
---

Relocate findAssociatedTokenAddress + TOKEN_PROGRAM_ADDRESS + ASSOCIATED_TOKEN_PROGRAM_ADDRESS from apps/cli/src/lib/token.ts to packages/pool (new @solana-program/token + @solana-program/associated-token deps for derivation + idempotent create-ix builder); re-export via @riprap/hanse; migrate CLI imports. pnpm -r build green.
