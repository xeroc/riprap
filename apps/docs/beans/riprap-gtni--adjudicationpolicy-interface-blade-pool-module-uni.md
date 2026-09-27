---
# riprap-gtni
title: AdjudicationPolicy interface + blade-pool module + unit tests
status: completed
type: task
assigned: implementer
created_at: 2026-09-25T08:53:10Z
updated_at: 2026-09-25T08:53:10Z
parent: riprap-x58j
blocked_by:
    - riprap-r8wf
---

src/adjudicate/policy.ts interface + policies/blade-pool.ts: five §7 slots in policy order + same-person rule, §3 coverage criteria, all ten §4 exclusions, verdict guidance (overpriced => Deny, amount as-filed). ZERO numbers — tests enforce with § citations. Selection via per-cluster mutual map. Seam: bean riprap-h6wp. Spec §7.


## Summary of Changes

- `apps/landing/src/adjudicate/policy.ts` — the `AdjudicationPolicy` interface
  (document slots, same-person rule, evidence-use note, coverage criteria,
  exclusions, verdict note). Interface only; the engine never imports a
  concrete pack (seam per bean riprap-h6wp).
- `apps/landing/src/adjudicate/policies/blade-pool.ts` — the blade instance:
  five policy §7 slots in order (paths pinned to the claim wizard's
  `CLAIM_DOCUMENT_PATHS`), same-person rule, policy §3 criteria (5), the ten
  policy §4 checklist exclusions (tier-max lands in the verdict note per copy
  doc step 3), verdict guidance (overpriced ⇒ Deny, amount as filed, cap is
  the chain's job). Every string quotes copy doc § /app/adjudicate byte-exact.
- `apps/landing/src/adjudicate/policies/index.ts` — `adjudicationPolicyFor`:
  v1 single-tenant selection via the per-cluster mutual map; keyed registry /
  anchored fetch stays behind the seam.
- Tests: `policies/blade-pool.test.ts` (order, verbatim copy, zero-numbers
  walk with § citations, slot-path no-drift vs the claim wizard) +
  `policies/index.test.ts` (selection).
- Gate repair (pre-existing red in the required landing legs): restored
  `shareText`'s unread-tier figures drop (its own header + copy doc §144
  still specified it; the 2026-09-24 rewrite had lost it), and aligned the
  stale ShareRow/BreakpointPage assertions with the shipped quieter-cover
  copy (odds rows, share message, hash POOL_URL, mention-only X/Farcaster).
  Copy-doc reconciliation filed as bean riprap-k9jl (meta/ edits are not a
  code-change side effect).
- Scoped gate: `pnpm -r run build` ✅ · `pnpm lint` exit 0 (83 pre-existing
  warnings, untouched) · `pnpm --filter @riprap/landing run test` 201/201 ✅.
  No browser pass: pure data module, no rendered surface (screen beans
  exercise it in riprap-8sra/cqif).