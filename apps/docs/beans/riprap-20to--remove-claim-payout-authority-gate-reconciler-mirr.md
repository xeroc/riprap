---
# riprap-20to
title: Remove claim_payout authority gate + reconciler mirror + docs
status: completed
type: task
assigned: implementer
priority: high
created_at: 2026-10-15T08:01:18Z
updated_at: 2026-10-15T14:20:00Z
parent: riprap-hxed
---

One change, per the AGENTS.md propagation list:
- [x] `programs/hanse/src/instructions/claim_payout.rs` — pilot authority constraint out (the comment marks it, ADR-0005)
- [x] `apps/cranker/src/reconciler.ts` — mirrored authority pre-check in reconcileSettled deleted (comment marks it)
- [x] `apps/docs/adr/ADR-0005` + `meta/specs/EVENT-MUTUAL.md` §7/§12 wording updated in the same change
- [x] `anchor build` + `pnpm --filter @riprap/hanse codegen` — regenerated client committed
- [x] e2e/LiteSVM expectations asserting the rejection flipped to assert success
- [x] `.changeset/*.md` patch, `@riprap/hanse`

## Summary of Changes

- `claim_payout.rs`: the `cranker == mutual.authority @ Unauthorized` constraint commented out (ADR-0005's prescribed retirement path) + doc comment updated — any key may crank; the payout still lands only in the claimant's canonical ATA.
- `apps/cranker`: reconciler's mirrored authority skip in `reconcileSettled` deleted; matrix test flipped (non-authority cranker now dispatches claim_payout); headers/env/README prose updated to permissionless.
- LiteSVM: `non_authority_cranker_reverts` → `non_authority_cranker_pays_claimant` (asserts the §8 $2,015 payout lands + Paid status under a stranger's crank); security row S1 flipped to assert permissionless success (replaced, not deleted).
- e2e: spec-a cranks the payout with a funded stranger; spec-e's non-authority rejection → success (stranger pays claimA → Paid, double-pull still reverts CLAIM_ALREADY_PAID; ERR.UNAUTHORIZED entry dropped); spec-c comment fixed.
- Docs: ADR-0005 amended (title, decision bullet, consequences); EVENT-MUTUAL preamble amendment entry + §6 authority-field comment + §7 claim_payout block + §12 pass-gate row. AGENTS.md cranker Parts row + the executed propagation bullet cleaned.
- Codegen: `@riprap/hanse` regenerated (claimPayout account docs ride the IDL).
- Verification: `anchor build --arch v2` green; `cargo test` full workspace green (114 tests) with `ACCORD_SO` pointed at the sibling's sBPFv1 accord artifact — the default sibling `make build` emits canonical sBPFv3 which litesvm 0.10 rejects (pre-existing tracked drift, beans riprap-v3elf/riprap-0udy; the v0/v2 rebuild recipes stub-link under current tools); `pnpm -r run build` green; `pnpm lint` 0 errors (68 pre-existing style warnings, none on touched lines); `pnpm -r run test` all green (pool 12, ui 196, hanse 40, cranker 23, cli 108, landing 45 files, jest e2e 7 suites).
