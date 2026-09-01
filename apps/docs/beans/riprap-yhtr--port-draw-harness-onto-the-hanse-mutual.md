---
# riprap-yhtr
title: Port draw harness onto the hanse mutual
status: todo
type: task
tags:
    - ts
    - e2e
created_at: 2026-09-01T17:39:46Z
updated_at: 2026-09-01T17:39:46Z
parent: riprap-oaa8
blocked_by:
    - riprap-4ma4
---

Adapt accord tests/src/draw-harness.ts:
- @useaccord/sdk@0.1.0 buildAccumulator / proofFor / resolveSeat / MSTNode + the roleAccord multi-signer pattern for juror-side instructions.
- Jurors = mutual members staking into its subaccord (stake-only — no attestation, bean riprap-7wa9); default stake = tier contribution per spec §12.
- VRF: request_vrf CPIs the magicblock oracle which is absent on surfnet — inject committed_vrf + frozen_root + frozen_total_stake via surfnet_setAccount exactly as accord vrf.ts, codecs from @useaccord/sdk, root read live from the subaccord.
- draw_seat seat-by-seat incl. deterministic collision re-roll retries; commit/reveal/finalize choreography helpers.
- Smoke: one dispute driven to Final against a hand-made subaccord before hanse specs consume it.

Checklist:
- [ ] smoke dispute completes (draw -> commit -> reveal -> final)
