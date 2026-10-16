---
# riprap-sj1o
title: Review def resolution epic
status: completed
type: task
assigned: reviewer
priority: normal
created_at: 2026-10-15T08:01:38Z
updated_at: 2026-10-15T08:02:04Z
parent: riprap-hs4r
blocked_by:
    - riprap-vqoa
---

- [x] No per-pool branches introduced anywhere in generic engines (grep def path)
- [x] Dropped-state law: no fallback content for missing/invalid defs
- [x] AGENTS.md map updated; changesets present; scoped gate green per epic

## Review findings

- Per-pool branches: none in the generic engines. The def module, generic
  page/hero, store, Wizard/Restore, PoolSession, DocumentsStep, manifest
  serialize/parse, fetchJurorPackage, and documents.ts carry no pool names
  in code — the only matches are the registries' static first-party tables
  (by design: the def path bypasses them) and two doc comments.
- Dropped-state law holds everywhere the def refuses: the generic page's
  bands (not-an-address / not-found / missing / not-a-def / retry states),
  the store's silent drop, the wizard's resolve-then-redirect, and the
  session's no-policy block after the def read refuses — each renders
  honest copy, never invented content. Verified in the unit suites and
  live on devnet during riprap-vqoa's pass.
- Observation (no action, v1 accepted): a transient daemon outage drops a
  community pool from the band until the next scan-triggered refetch —
  the failed def query (retry 0, staleTime Infinity) stays failed. That is
  fail-closed and matches the dropped-is-a-state law; if community pools
  proliferate, consider a bounded retry.
- Seams for the def-format bean (riprap-i6c3, parallel lane, not yet
  landed): this epic authored def/schema.ts + def/sections.ts to the
  milestone contract because no sibling had landed and the tree must
  compile — reconcile at merge (added/added); the AGENTS.md propagation
  edge pins the inverse relationship (renderer's § headers ↔ sections.ts,
  frontmatter contract ↔ schema.ts).
- Ledger: AGENTS.md Parts row + "Def module / community pools" propagation
  edge landed with riprap-jo1k; five changesets present
  (generic-pool-pages, def-packs-deblading, store-cas-community-band,
  policy-seam-retired, def-test-matrix); scoped gate green as of this
  review — build exit 0, lint exit 0, landing suite 48 files / 448 tests.
