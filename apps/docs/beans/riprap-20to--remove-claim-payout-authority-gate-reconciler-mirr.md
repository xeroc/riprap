---
# riprap-20to
title: Remove claim_payout authority gate + reconciler mirror + docs
status: todo
type: task
assigned: implementer
priority: high
created_at: 2026-10-15T08:01:18Z
updated_at: 2026-10-15T08:01:18Z
parent: riprap-hxed
---

One change, per the AGENTS.md propagation list:
- [ ] `programs/hanse/src/instructions/claim_payout.rs` — pilot authority constraint out (the comment marks it, ADR-0005)
- [ ] `apps/cranker/src/reconciler.ts` — mirrored authority pre-check in reconcileSettled deleted (comment marks it)
- [ ] `apps/docs/adr/ADR-0005` + `meta/specs/EVENT-MUTUAL.md` §7/§12 wording updated in the same change
- [ ] `anchor build` + `pnpm --filter @riprap/hanse codegen` — regenerated client committed
- [ ] e2e/LiteSVM expectations asserting the rejection flipped to assert success
- [ ] `.changeset/*.md` patch, `@riprap/hanse`
