---
# riprap-cqif
title: 'Wizard integration tests: gating, back-nav, persistence'
status: completed
type: task
assigned: tester
created_at: 2026-09-25T08:53:11Z
updated_at: 2026-09-27T11:40:00Z
parent: riprap-x58j
blocked_by:
    - riprap-2xug
---

Gating order, back-nav invariants, checklist persistence keyed (mutual, dispute, round) surviving reload, salt-bridge restore across sessions, no-persist law for decrypted bytes, not-your-seat honest state. HANDOFF §6.

## Summary of Changes

- The integration subject had to exist first: the seven landed step
  components were standalone with no composition. `SessionWizard.tsx` is
  that composition — the lock-step machine (forward only through the next
  complete step via `advanceFrom` — a step's onDone vouches its own
  completion while the machine re-checks every earlier step's persisted /
  chain state, avoiding stale-closure ceilings; back free at any time,
  exiting to the board at step 0) + the step-0 PackageGate rendering the
  copy-doc § step-0 honest states (fetching / pending+Try again / no-key
  terminal / no-evidence / verified hash line / terminal `Do not vote.`).
  A fresh mount lands on the FIRST INCOMPLETE step — §8 stores + chain
  flags re-derive completeness, so a reload resumes exactly where the
  juror left off.
- `SessionWizard.test.tsx` (11 tests, HANDOFF §6 matrix): gating order
  (pending/failed package blocks the documents; an unanswered checklist
  blocks the verdict; an unmade verdict blocks commit), back-nav
  invariants (walk-back with persisted answers intact, exit at step 0),
  persistence keyed (mutual, dispute, round) surviving remount + no
  cross-round leakage, salt-bridge restore across sessions (committed
  seat → reveal one-click), the no-persist law (walking the documents
  leaves only whitelisted `riprap.adjudicate.*` keys — no blob URLs, no
  evidence bytes), and the outcome loop (revealed seat → outcome → the
  three stores clear). Not-your-seat stays asserted in
  `AdjudicatePage.test.tsx` (the shell's gate — the wizard never mounts
  for a non-drawn wallet).
- Wiring: `AdjudicatePage`'s SessionShell now renders the wizard after
  the phase clock — seam-honest v1 per spec §5/§9 (no delivery key →
  the no-key terminal state; amount/fee/ruling read as {{PARAM}} nulls;
  Round PDA via `findRoundPda`), so the session route runs the composed
  wizard today and the delivery-key registration interface lands as a
  provider change.
- Supporting exports: `documentsComplete` (DocumentsStep) and
  `loadPolicyAnswers` (PolicyStep) — the machine's pure completeness
  reads.
- Scoped gate: `pnpm -r run build` (8/8), `pnpm lint` (0 errors),
  `@riprap/landing` 313/313 (adjudicate dir 158/158).
