---
# riprap-8sra
title: Checklist + verdict screens with completion gating
status: completed
type: task
assigned: implementer
created_at: 2026-09-25T08:53:11Z
updated_at: 2026-09-27T11:06:00Z
parent: riprap-x58j
blocked_by:
    - riprap-gtni
    - riprap-4sz5
---

Steps 2–3: checklist from AdjudicationPolicy (yes/no/unsure valid, blanks block), binary verdict labeled from the hanse-opt/v1 recipe (Approve=0/Deny=1), overpriced=>Deny restated; gating + free back-nav. Spec §4.


## Summary of Changes

- `apps/landing/src/adjudicate/PolicyStep.tsx` — wizard step 2 POLICY: every
  policy §3 criterion + §4 exclusion from the AdjudicationPolicy pack as a
  yes/no/unsure radio question (blank the only blocker), intro + group
  headings verbatim from copy doc § /app/adjudicate step 2, §8 persistence
  keyed (mutual, dispute, round) via `policyAnswersKey`/`clearPolicyAnswers`,
  pure `checklistComplete` gate exported for the wizard shell, free back-nav.
- `apps/landing/src/adjudicate/VerdictStep.tsx` — step 3 VERDICT: as-filed
  amount mono (`{{PARAM}}` until the chain answers), the pack's verdictNote
  (overpriced ⇒ Deny restated; tier max stays out of the checklist), binary
  choice from `VERDICT_OPTIONS` — hanse-opt/v1: Approve = 0, Deny = 1
  (file_claim.rs::option_label) — onDone carries the option index to COMMIT.
- `packages/ui/src/components/ui/radio.tsx` (+ story, exported) — native
  radio restyled to the checkbox's DESIGN.md law (kit chrome law; the kit
  lacked one); no new cross-package import edges (existing @riprap/ui edge).
- Tests: `PolicyStep.test.tsx` (15 questions verbatim, blank-blocking gate,
  unsure admissible, answer switching, §8 persistence incl. cross-key
  isolation + clear, pure gate) and `VerdictStep.test.tsx` (amount + PARAM,
  verdictNote verbatim, exactly two recipe buttons, indices 0/1, back free).
- Scoped gate: `pnpm -r run build` (8/8), `pnpm lint` (0 errors),
  `@riprap/ui` 180/180, `@riprap/landing` 271/271, `build-storybook` green.
  (ServeActions timeouts during verification were a lint:fix arrow-rewrite
  of a constructable mock — reverted; that file is byte-identical to head.)