---
# riprap-xfqj
title: set_subaccord_param + tests
status: todo
type: task
tags:
    - rust
    - tdd
created_at: 2026-09-01T17:39:27Z
updated_at: 2026-09-01T17:39:27Z
parent: riprap-ggsd
blocked_by:
    - riprap-dh7g
---

EVENT-MUTUAL §2.10/§7 — demo admin lever.
Authority == Mutual.authority (initializer) only. Wraps accord propose_subaccord_update: mutual PDA signs as subaccord authority; data-free rent payer = initializer wallet (ADR-0028). Payload = typed passthrough of the accord UpdatePayload variants chosen for v1 — min_stake at minimum (the MAJORITY-EXPLOIT §6 incident-response lever: raise min_stake mid-event); decide windows/alpha inclusion at implementation and document the choice.
48h timelock is accord-side: propose here; execute_subaccord_update is permissionless there. Test the execute via clock warp.

Tests: admin gate reverts for anyone else, proposal lands (PendingUpdate PDA exists with exact payload), accord bounds still enforced, timelocked execute succeeds after warp.

Checklist:
- [ ] red then green incl. timelock warp
