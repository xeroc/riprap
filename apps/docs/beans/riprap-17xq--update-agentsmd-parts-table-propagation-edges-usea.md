---
# riprap-17xq
title: Update AGENTS.md Parts table + propagation edges (@useaccord/sdk/evidence)
status: completed
type: task
priority: normal
assigned: implementer
created_at: 2026-09-22T14:00:09Z
updated_at: 2026-09-22T21:05:00Z
parent: riprap-lqra
---

## Summary of Changes

Base: milestone output `loyuxoov` (all wizard beans completed there; the lane
had already added the Frontends-row route entry — `#/app/file-claim`, its lazy
`entry.tsx`, and the wizard directory in the chain-code law).

- **Parts table, Cross-repo pin row**: `@useaccord/sdk@0.1.0` consumers now
  include apps/landing's root-export subaccord reads/PDAs
  (`src/pool/useMinStake.ts`, `src/app/` surfaces incl. the wizard) AND the
  `@useaccord/sdk/evidence` export (`src/app/file-claim/evidence.ts` —
  `claimantEncrypt` ECIES delivery to the evidence operator per ADR-0031).
- **Accord pin bump propagation bullet**: audit list gains
  `apps/landing/src/pool/useMinStake.ts` + `apps/landing/src/app/` (incl. the
  `/evidence` export) beside the existing CLI/tests sites.

Reality was established by sweeping imports (`from "@useaccord/sdk` across
apps/packages/tests): 20 sites total; landing holds 9 (pool page read, app
surfaces, wizard incl. /evidence) — all now covered by the two rows. The
Frontends row needed no further edit (the lane's route-entry text already
carries the wizard). `pnpm lint` green after the edit (docs-only change).
