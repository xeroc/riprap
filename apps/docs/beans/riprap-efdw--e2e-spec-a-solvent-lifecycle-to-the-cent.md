---
# riprap-efdw
title: 'e2e spec a: solvent lifecycle to the cent'
status: todo
type: task
tags:
    - ts
    - e2e
created_at: 2026-09-01T17:40:02Z
updated_at: 2026-09-01T17:40:02Z
parent: riprap-oaa8
blocked_by:
    - riprap-yhtr
    - riprap-vrzq
---

EVENT-MUTUAL §8 shape, scaled cohort with cleanly dividing numbers, everything driven THROUGH @riprap/hanse + @riprap/pool SDKs (the SDK <-> program leg):
initialize_mutual (short windows, pilot-tier shape) -> members join (mixed tiers ok) -> jurors stake -> file_claim -> draw -> commit/reveal Approve -> finalize_dispute -> settle_claim Approved -> settle_pool ratio exactly 1e9 -> claim_payout (authority co-sign; spend + burn) -> dissolve -> pool crank residuals.
Assert EXACT token-unit balances at every hop: claimant receives claim_amount + fee refund; claimant depositor total burns to 0; each non-claimant residual = contribution x remaining_treasury / remaining_total; treasury 0 after all cranks; claims_filed/resolved counters; phase transitions Active -> Settled -> Dissolved.

Checklist:
- [ ] spec green serially on one Surfpool
