---
# riprap-cwa0
title: Scoped pnpm verify + dev-server browser pass + PR packaging
status: completed
type: task
assigned: reviewer
created_at: 2026-09-25T08:53:11Z
updated_at: 2026-09-27T12:10:00Z
parent: riprap-v1ou
blocked_by:
    - riprap-d5vw
---

Completion gate scoped to landing legs per AGENTS.md table (build, lint, landing tests; storybook only if kit atoms changed) + browser pass: mount, board states, session walkthrough with mocked delivery, commit/reveal on localnet; PR with copy quotes + number provenance + ship-it ASCII.

## Summary of Changes

**Code fix (gate repair):** `packages/ui/src/components/chrome/CopyBlock.tsx` — the copied-state revert timer leaked past unmount and fired into torn-down jsdom environments (`window is not defined` uncaught exception → `@riprap/landing` vitest exit 1, flaky under parallel load). The component now owns the timer: `useRef<number | undefined>` id, `clearTimeout` on unmount and before re-arm (double-copy keeps the full 2s).

**Scoped gate (per AGENTS.md table — `apps/landing` + `packages/ui` rows; stories changed via `radio.stories.tsx`):**
- `pnpm -r run build` ✅
- `pnpm lint` exit 0 — 0 errors; 8 warnings in lane files, all test-only (2 `useArrowFunction` carry in-code justifications "the arrow can't construct"; 5 `noNonNullAssertion` + 1 in `spec-d-appeal.spec.ts` match the repo's fixture-indexing baseline)
- `pnpm -r run test` ✅ — pool 12, ui 180, hanse 38, remotion 24, cranker 23, cli 105, landing 313 (38 files) — all lanes exit 0 after the CopyBlock fix
- `pnpm --filter @riprap/ui run build-storybook` ✅ (`radio.stories.tsx` added by the lane)

**Browser pass (dev server, headless Chromium):** `#/app/adjudicate` mounts (title `Riprap: Adjudicate`, H1 `Jury duty`, honest no-wallet gate per copy doc § /app/adjudicate L186); session deep-link `#/app/adjudicate/<dispute>/<round>` parses and degrades to the same honest gate — no evidence fetch; `#/app` mounts `Members' entrance` (copy doc L154); zero console errors / pageerrors on all three routes.

**Honest boundary:** live session walkthrough + commit/reveal on localnet are not browser-exercisable — the delivery-key registration interface is EXTERNAL/PENDING (milestone open question §7; delivery decrypts only through the `DecryptDelivery` seam) and no validator is running. Covered instead by the green suites: SessionWizard integration (walkthrough, gating, back-nav, §8 persistence, salt-bridge restore), CommitStep/RevealStep (instruction accounts/args shapes), verification.test.ts (root/leaf gates, 409-pending), DocumentsStep/PolicyStep/VerdictStep/OutcomeStep.

**PR packaging:** title `[landing] adjudication dashboard v1 — #/app/adjudicate (juror surface)`, body with copy-doc quotes (§ /app/adjudicate L186, § /app L154), number provenance (policy modules zero-numbers, chain-read numerals only; unit tests cite policy §3/§4/§7), verify tail above — delivered in the lane report.
