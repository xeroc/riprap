---
# riprap-xfqj
title: set_subaccord_param + tests
status: completed
type: task
tags:
    - rust
    - tdd
created_at: 2026-09-01T17:39:27Z
updated_at: 2026-09-02T06:10:00Z
parent: riprap-ggsd
blocked_by:
    - riprap-dh7g
---

EVENT-MUTUAL §2.10/§7 — demo admin lever.
Authority == Mutual.authority (initializer) only. Wraps accord propose_subaccord_update: mutual PDA signs as subaccord authority; data-free rent payer = initializer wallet (ADR-0028). Payload = typed passthrough of the accord UpdatePayload variants chosen for v1 — min_stake at minimum (the MAJORITY-EXPLOIT §6 incident-response lever: raise min_stake mid-event); decide windows/alpha inclusion at implementation and document the choice.
48h timelock is accord-side: propose here; execute_subaccord_update is permissionless there. Test the execute via clock warp.

Tests: admin gate reverts for anyone else, proposal lands (PendingUpdate PDA exists with exact payload), accord bounds still enforced, timelocked execute succeeds after warp.

Checklist:
- [x] red then green incl. timelock warp

## Summary of Changes

- `instructions/set_subaccord_param.rs`: admin gate (authority == Mutual.authority, typed Unauthorized), PendingUpdate PDA verified in handler, CPI `accord::propose_subaccord_update` with the mutual PDA signing as the subaccord authority (invoke_signed, seeds from persisted `mutual.seed`) and the admin wallet as data-free rent payer (ADR-0028); SubaccordParamSet emitted.
- Lever set chosen and documented (bean left it to implementation): `SubaccordParam` = MinStake, FeePerJuror, AlphaBps, Review/Commit/Reveal/AppealWindow — the economics + windows. Deliberately excluded: Authority (not a demo knob), EvidenceOperator (§9 pipeline key), MaxAppeals/RevealThresholdBps/MaxDrawAttempts (sortition machinery). Maps 1:1 onto accord's UpdatePayload.
- Tests: proposal lands with exact payload + proposed_by = mutual PDA + execute_after = slot + 432_000; non-admin (Unauthorized); accord floor rejected at propose (MinStake 0); timelock holds then permissionless execute lands after a 432_001-slot warp and the subaccord shows the new min_stake. 4/4.
- clippy 0; pnpm verify 0.