---
# riprap-w8uj
title: 'Review wizard epic'
status: completed
type: task
assigned: reviewer
priority: normal
created_at: 2026-10-15T08:01:53Z
updated_at: 2026-10-15T15:50:00Z
parent: riprap-gob1
blocked_by:
    - riprap-f199
---

- [x] Wizard writes nothing beyond initialize_mutual + the doc PUT (no server state, drafts local-only)
- [x] Copy-doc law: every user-visible string quotes landing-page.md
- [x] Route chores complete (router, title, llms.txt, redirect-none-needed); AGENTS.md map updated; changeset present; scoped gate green

## Review verdict ( PASS after two fixes )

- Writes audit: `grep method: create/` → exactly one PUT (deploy.ts, the
  hash-gated doc PUT); one sendInstruction (initialize_mutual); the only
  storage is the localStorage draft (draft.ts). The seed check is a read.
  No server state anywhere. PASS.
- Copy-doc law: two findings, both fixed in this change — (1) the author
  form's name placeholder named a pilot pool ("Chairmageddon") inside
  platform chrome, an instance leak under the category-vs-instance law →
  now `The pool's name`; (2) the two taken-seed lines the preview and
  drawer render had no verbatim source in § /create → added to the doc
  (preview variant + drawer variant). Every other rendered string traces
  to the copy doc section authored in this epic. PASS after fixes.
- Route chores: `#/create` router case + the route-title map (with both-way
  swap test), lazy CreatePage chunk, llms.txt entry (asserted by
  main.test.tsx), no MPA path replaced so no redirect stub; AGENTS.md
  Project-Overview map edge carries the full create surface (author/doc
  core/deploy/CAS-PUT/verify, def-format convergence note); four
  changesets across the epic (author+preview minor, deploy minor, test
  matrix patch, review patch). Scoped gate: `pnpm -r run build` exit 0 ·
  `pnpm lint` 0 errors (70 pre-existing warnings; the epic's own are the
  two positional-key warnings on tier/proof rows whose row order IS the
  slot identity — CoveredOverlay precedent) · landing suite 447/447 (one
  load-flake observed once under machine load, green on immediate rerun
  and in every other run). PASS.
- Outstanding, outside this epic's automated scope: the devnet browser
  pass (draft bean riprap-glxj — needs a funded devnet wallet + live
  daemon, human-owned); and the def-format convergence swap of
  create/doc.ts onto mutuals/def/ when that epic lands (noted in code +
  AGENTS.md).
