---
# riprap-vrzq
title: Hanse SDK PDA + fetch helpers with tests
status: todo
type: task
tags:
    - ts
    - tdd
created_at: 2026-09-01T17:39:46Z
updated_at: 2026-09-01T17:39:46Z
parent: riprap-bkxy
blocked_by:
    - riprap-dw6d
---

packages/hanse/src mirroring packages/pool/src:
- pdas.ts: mutualPda [mutual, seed le], memberPda, claimPda, authority PDAs [mutual_auth, mutual] / [mutual_own, mutual], fee float ATA; pool-side passthroughs the e2e needs (treasury, depositor).
- fetch.ts: fetchMutual / fetchMember / fetchClaim decoded getters over the generated accounts tree.
- vitest colocated (pool test style): PDA vectors match the on-chain seeds EXACTLY (pin vectors; assert stability); fetch tests follow the pool fetch.test.ts pattern.
- NO tier table constant in the SDK — data law: prices live on-chain (Mutual.tiers) and in packages/ui lib/poolMath.ts only.

Checklist:
- [ ] helpers + green tests
- [ ] lint clean
