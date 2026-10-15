---
# riprap-hs4r
title: 'Def resolution: CAS listings, generic pool surfaces, def-built packs, de-blading'
status: todo
type: epic
priority: high
created_at: 2026-10-15T08:00:28Z
updated_at: 2026-10-15T08:00:28Z
parent: riprap-9bh4
blocked_by:
    - riprap-plok
---

Milestone D3/D4/D5: unknown on-chain mutuals resolve through their anchored
def and render through generic surfaces; claim/juror packs build from the
def; the blade-flavored defaults in generic code die. Scope in four
parallelizable chunks:

1. Store: scan hits without a data.ts listing -> `seed`+`policyHash` off the
   decoded Mutual -> `domainRefHex` -> CAS GET (cached per ref, immutable
   bytes) -> validate -> derived LiveMutual; 404/hash-mismatch/bad-schema
   dropped (a state, never fallback content). Community band renders derived
   listings below the founder directory (no badges, first-party order
   untouched).
2. Generic surfaces: registry fallback pubkey -> GenericPoolPage =
   PoolPageShell + GenericPoolHero (marketing block, kind-templated
   defaults, existing usePoolJoin machine); doc bands parsed from the def
   body's § sections via the def-format epic's parser.
3. Pack builders (pure): def -> ClaimFlow and def -> AdjudicationPolicy per
   milestone HANDOFF §4; derived listings resolve packs from the def, never
   the static registries; zero-numbers + slot-parity asserted.
4. De-blading: CLAIM_DOCUMENT_PATHS defaults deleted from
   app/file-claim/manifest.ts AND adjudicate/package.ts (slots always
   threaded); DocumentsStep consumes pack.samePersonRule/evidenceUseNote;
   AdjudicatePage generic not-live copy; documents.ts url slots accept any
   https URL.

Acceptance = milestone HANDOFF §5 store/packs/hero items + the devnet
browser pass (CLI-deployed mutual with published def: listed, joined,
claim filed, juror session runs). Changeset: minor. AGENTS.md Parts table +
propagation edges (def module, CAS resolution, community band) ride with
chunk 1.

Tasks: 3x implement (parallel) -> test -> review.
