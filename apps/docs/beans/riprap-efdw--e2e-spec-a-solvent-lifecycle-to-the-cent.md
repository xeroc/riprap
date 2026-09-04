---
# riprap-efdw
title: 'e2e spec a: solvent lifecycle to the cent'
status: completed
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
- [x] spec green serially on one Surfpool

## Summary of Changes

- `tests/src/spec-a-solvent.spec.ts` — the full solvent lifecycle through `@riprap/hanse` + `@riprap/pool` instruction factories: `initialize_mutual` (pilot tiers $10/$1k · $20/$2k · $40/$4k, short windows; subaccord domain_ref = sha256("hanse:subaccord" ‖ seed ‖ policy_hash) reproduced in TS) → 10 × Standard joins (treasury exactly $200, depositor rights 1:1) → 3 member-jurors stake $20 each (§12 convention) into the mutual's subaccord → `file_claim` ($95 clamped amount, $15 fee funded upfront, nonce = mutual.claim_nonce, dispute PDA ["dispute", mutual, 0]) → VRF injection + `draw_seat` × 3 with collision re-rules → commit/reveal all-Approve → `finalize_round`/`finalize_dispute` (ruling 0) → `settle_claim` Approved (obligations $95 + fee refunds $15) → `settle_pool` ratio exactly 1e9 → `claim_payout` with authority co-sign (claimant +$110 = claim + fee refund; depositor burns to 0; treasury $90) → `dissolve` (liquidation balance $90, pool total $180) → 9 × `crank` residuals of exactly $10 each, treasury → $0. Counters (claims_filed/resolved/claim_nonce) and phase transitions Active → Settled → Dissolved asserted at every hop.
- `tests/src/draw-harness.ts` — new `armMutualJurors` (stake caller-supplied member signers into an existing subaccord; port of accord's armCanonJurors) and self-sufficient `setupDrawFixture` (ensures the accord deployment regardless of jest file order). `tests/src/setup/env.ts` — `extractLogs` now also walks kit's `context.logs`. `tests/package.json` — `test` script gates on `tsc --noEmit` (ts-jest's isolatedModules skips type checking; this class of error otherwise only surfaces at runtime); deps += `@noble/hashes` (domain_ref hashing).
- **Program fix (discovered by this e2e):** `programs/hanse/src/instructions/initialize_mutual.rs` `SUBACCORD_DEPTH` 20 → 12. A depth-20 Merkle path is 20 × 40 B = 800 B of instruction data — `stake`/`draw_seat` transactions serialize to 1386 B, past the 1232-B packet limit, so jurors could never stake into or draw from a mutual's subaccord. Depth 12 (4096 leaves ≥ pilot target of < 3,000 members) keeps proof-carrying instructions ≈ 500 B under budget. IDL doc changed → `pnpm --filter @riprap/hanse codegen` regenerated (doc-only diff).
- Verification: `anchor test --skip-build` exit 0 (fresh Surfpool: runbook deploys pool+hanse, jest deploys accord; 4/4 specs, spec a in ~9 s); offline `pnpm --filter @riprap/tests test` 4/4 skip-clean with the tsc gate; full `pnpm verify` exit 0.
