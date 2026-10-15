---
# riprap-h6wp
title: 'Adjudication policy pack: swap in-repo module for anchored domain-CAS fetch when a second policy appears'
status: todo
type: task
priority: normal
created_at: 2026-09-25T00:00:00Z
updated_at: 2026-10-15T08:02:33Z
parent: riprap-hs4r
---

Decision (adjudication-dashboard grill, 2026-09-25, Q3 = C): the juror surface's
policy requirements ship as an in-repo typed data module
(`apps/landing/src/adjudicate/policies/<name>.ts` implementing
`AdjudicationPolicy`, selected via the per-cluster mutual map). The engine
consumes the interface only — never blade-pool specifics.

This bean is the reminder for the committed seam: when a policy author who is
not a repo dev actually appears, swap the pack source to a machine-readable
document in the evidence daemon's domain CAS (anchored + client-verified like
`usePolicyDoc` reads the cover terms today). That swap must stay a provider
change behind `AdjudicationPolicy`, not an engine rewrite. Open question then:
the anchoring convention (nothing on-chain pins a pack doc today — derivation
convention or a mutual field; program change).

Same-family cleanup parked here: the claim wizard's hardcoded
`CLAIM_DOCUMENT_PATHS` (file-claim/manifest.ts) should read from the same
`AdjudicationPolicy` doc-slot definitions once a second policy exists, so
claimant slots and juror checklists can never drift.

- 2026-10-15: reparented under riprap-hs4r — the def-resolution epic's pack-builder task (riprap-97b6) implements this swap as its def-driven registry path; the wizard milestone (riprap-9bh4) is the 'policy author who is not a repo dev' this bean was waiting for. The open anchoring question is answered by the milestone: the def doc IS the anchored artifact (policy_hash over the whole file).
