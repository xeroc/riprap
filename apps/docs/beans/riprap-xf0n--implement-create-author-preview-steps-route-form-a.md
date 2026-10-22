---
# riprap-xf0n
title: 'Implement #/create author + preview steps (route, form, advanced drawer)'
status: completed
type: task
assigned: implementer
priority: high
created_at: 2026-10-15T08:01:52Z
updated_at: 2026-10-15T15:00:00Z
parent: riprap-gob1
---

- [x] `src/main.tsx` router case + `<title>` + lazy CreatePage; router-test case; `public/llms.txt` entry; copy in meta/marketing/03-website-copy/landing-page.md first (source-doc law — PR quotes the line)
- [x] Author form over the def schema (name, kind, peril definition, exclusions, tiers 1-3, period + venue, proof slots with file|url + optional verify, roster if bounty, marketing optional); kind is a copy-selector only
- [x] Advanced drawer: ALL 17 initialize_mutual inputs (milestone HANDOFF §2), §12 pilot preset pre-filled, evidence_operator = riprap daemon default (env-resolved, overridable), client-side mirror of every on-chain gate with mapped one-line deadpan notes
- [x] Preview: deterministic doc render + policy_hash + derived domain_ref (mono), live rehash on edit; random u64 seed, re-pick on collision
- [x] Draft persistence: localStorage fields only (file-claim draft pattern), resumable until deploy succeeds
- [x] `.changeset/*.md` minor (with the epic's deploy task)

## Summary of Changes

- Route: `#/create` case + lazy `CreatePage` + a route-scoped `<title>` swap
  (`Riprap: Create a pool`) in `src/main.tsx`; router-test case (title swaps
  both ways); `public/llms.txt` entry; copy authored FIRST in
  `meta/marketing/03-website-copy/landing-page.md` § /create (all five steps'
  copy, so the deploy task renders from it verbatim); AGENTS.md route list
  updated.
- Doc core `apps/landing/src/create/doc.ts` (pure): DefDoc model mirroring the
  milestone §2 frontmatter contract, deterministic canonical renderer
  (frontmatter + 11-§ body, kind word-maps, economics rendered once into §7),
  def validation matrix, client-side mirrors of every initialize_mutual gate
  (odd jury, ladder ≤ 31, bps ≤ 10000, windows > 0, appeal ≥ 1h, draws 1–10,
  mixed-mint note), §12 preset, slot-path grammar, u64 seed, on-chain tier
  padding. CONVERGENCE NOTE in the header: the def-format epic
  (`mutuals/def/`, still todo in its own workspace) owns the canonical module
  — swap renderDefDoc/validateDef for its exports when it lands; the wizard's
  renderer is the single byte source until then (determinism + pinned sha256
  vector tested).
- `CreatePage.tsx`: AUTHOR step (pool/terms/tiers/window/proof/marketing
  bands, slug auto-derive, live rejection lines, kind copy-selector), the
  advanced drawer (mint, operator, 11 subaccord fields with preset + gate
  notes, read-only derived anchors), PREVIEW step (exact bytes mono block,
  sha256/domain_ref/seed anchors, doc download, edit-moves-the-hash note);
  seed collision check via `fetchMaybeMutualBySeed` with bounded re-pick.
- `draft.ts`: localStorage fields-only draft (file-claim pattern), one key,
  resumable, cleared by the deploy step on confirm.
- Tests: doc (determinism, frontmatter order, kind maps, §5 table, §7
  economics, 11 headers, validation matrix, gate mirrors incl. the Rust
  ladder vector, derivations, pinned hash vector), draft (round-trip, corrupt
  storage, clear), CreatePage smoke (mount, slug derive + Continue gate,
  preview anchors + Back, draft resume). Scoped gate green: `pnpm -r run
  build` exit 0, `pnpm lint` 0 errors (2 new warnings: positional keys on
  tier/proof rows whose row order IS the slot identity — same precedent as
  CoveredOverlay), landing suite 439/439.
- Not done here (sibling bean riprap-2kz6): DEPLOY/PUBLISH/VERIFY steps, the
  wallet gate, rent display, CAS PUT — the copy for those steps is already in
  the copy doc; the wizard's step machine is typed for their addition.
