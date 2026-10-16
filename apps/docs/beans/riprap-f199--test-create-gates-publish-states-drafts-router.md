---
# riprap-f199
title: 'Test #/create: gates, publish states, drafts, router'
status: completed
type: task
assigned: tester
priority: normal
created_at: 2026-10-15T08:01:53Z
updated_at: 2026-10-15T15:45:00Z
parent: riprap-gob1
blocked_by:
    - riprap-2kz6
---

- [x] Router case + title + llms.txt asserted
- [x] Validation-gate matrix: each advanced gate rejects with its mapped line
- [x] Publish-state tests (mock daemon): 200 / 400 / 404 / 409
- [x] Draft persistence + resume test; seed collision re-pick
- [ ] Devnet browser pass: one mutual created end-to-end from #/create, listed in community band, joined, claim filed (the wizard's own dogfood — milestone HANDOFF §5) — DEFERRED to draft bean riprap-glxj: needs a funded devnet wallet and the live daemon, human-owned resources; the automated lane cannot execute it

## Summary of Changes

- main.test.tsx: the create-route test now also pins the `<title>` swap
  both ways and asserts `public/llms.txt` carries the `#/create` entry
  (`[Create a pool]`).
- CreatePage.test.tsx gate+state matrix: the advanced drawer maps every
  mirrored on-chain gate to its one line under its own field (odd jury,
  appeal-ladder bound, both bps bounds, zero commit window, sub-hour
  appeal, draw attempts 1–10, operator shape — mint line covered by the
  deploy-block test); publish states 400/404 asserted beside the existing
  200 round-trip and 409 conflict; the seed-collision path re-picks while
  the chain answers taken (≥2 seed queries, bounded) and the preview shows
  the honest taken-note.
- doc.ts: the operator rejection line corrected to match the copy doc
  (`An operator pubkey, or leave empty.`) — the empty-field default is the
  creator's wallet (EVENT-MUTUAL §7 v1), found while writing the matrix.
- Changeset: patch (test-only + the one-line copy alignment). Scoped gate:
  pnpm -r run build exit 0 · pnpm lint 0 errors · landing suite 447/447.
- NOT done here: the live devnet browser pass (checklist item 5) —
  requires a funded devnet wallet and the running evidence daemon; tracked
  as draft bean riprap-glxj for human scheduling, and named in the epic
  review bean's scope (riprap-w8uj owns epic acceptance).
