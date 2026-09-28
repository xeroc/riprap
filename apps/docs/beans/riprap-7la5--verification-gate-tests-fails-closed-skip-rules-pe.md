---
# riprap-7la5
title: Verification gate tests (fails-closed, skip rules, pending)
status: completed
type: task
assigned: tester
created_at: 2026-09-25T08:53:10Z
updated_at: 2026-09-25T08:53:10Z
parent: riprap-wxs8
blocked_by:
    - riprap-4sz5
---

Root-mismatch terminal, leaf-mismatch terminal, sentinel/URL skip, incomplete-round pending, subaccord/filer cross-check failure, no-key honest state. HANDOFF §6 rows 2–3.

## Summary of Changes

- `apps/landing/src/adjudicate/verification.test.ts` (new): the composed step-0 gate matrix (HANDOFF §6 rows 2–3) — tampered manifest bytes → terminal root-gate failure with the per-file document route never touched (no document renders); `PackageVerification` maps to document slots only from `verified`; 409 round-incomplete → honest pending then verified on the retried fetch; leaf gates over the golden manifest (all five entries verify; one swapped document is terminal); the no-delivery-key honest state (no seam without a registered key, decrypt works once registered).
- Coverage map for the bean's named rows (asserted across the three suites): root-mismatch terminal + subaccord/filer cross-check failure + zero-slot → `package.test.ts` (riprap-6so0); leaf-mismatch terminal + sentinel/URL skip + 409-pending status mapping → `delivery.test.ts` (riprap-n8cx); composed/retry/no-key rows → `verification.test.ts` (this bean).
- Verification: adjudicate suite 86/86 green; `tsc -b` clean; `pnpm -r run build` green; root `pnpm lint` exit 0. Landing-wide test leg still carries the 6 pre-existing pool-page failures tracked in draft bean `riprap-oq7r` (red at the parent commit, unrelated to this lane).
