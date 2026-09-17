---
# riprap-da99
title: getJoinContext + buildJoinInstructions + typed errors + unit tests
status: todo
type: task
created_at: 2026-09-17T14:05:48Z
updated_at: 2026-09-17T14:05:48Z
parent: riprap-vol3
blocked_by:
    - riprap-hi6g
---

packages/hanse/src/join.ts per milestone HANDOFF §2/§4: pre-flight read (mutual, tiers, alreadyMember, balances, depositsOpen, canJoin/reason) + build-only instruction assembly [idempotent ATA-create, join] with guard re-runs throwing InsufficientBalance/DepositsClosed/AlreadyMember. Unit tests: derivation parity vs CLI fixtures, guard matrix, missing-ATA=0 path.
