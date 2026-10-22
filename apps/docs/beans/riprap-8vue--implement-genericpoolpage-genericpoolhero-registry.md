---
# riprap-8vue
title: Implement GenericPoolPage + GenericPoolHero + registry fallback
status: completed
type: task
assigned: implementer
priority: high
created_at: 2026-10-15T08:01:38Z
updated_at: 2026-10-15T08:01:38Z
parent: riprap-hs4r
---

- [x] `mutuals/registry.ts`: route id not in POOL_PAGES -> GenericPoolPage (lazy)
- [x] `pages/GenericPoolPage.tsx`: PoolPageShell with PoolPageConfig built from the def; doc bands from §-sections via def-format's sections.ts (definition/notes §3, exclusions §4, tier table §5, proof §7, end note §8; grades render from body prose)
- [x] `pages/GenericPoolHero.tsx`: marketing block (headline, blurb, odds, share) with kind-templated defaults when absent; join flow on the existing usePoolJoin machine; {{PARAM}} until chain answers; CoveredOverlay + PolicyAcceptNote parity with hand-written heroes
- [x] Raw-policy band binds to the mutual's derived domain_ref (existing RawPolicyTerms, unchanged)

## Summary of Changes

- `mutuals/def/` seam (schema/sections/listing): spec-literal per milestone
  riprap-9bh4 HANDOFF §2/§4 — frontmatter parse (`yaml` dep), the §-parser
  (blocks keyed by number), and the derived MutualListing. NOTE for the
  def-format bean (riprap-i6c3): I authored schema.ts/sections.ts because no
  sibling had landed and my tree must compile — reconcile at review (merge
  added/added).
- `pages/GenericPoolPage.tsx`: route id → useMutual → usePolicyDoc (CAS bytes
  by derived domain_ref) → parseDefDoc → PoolPageShell + GenericPoolHero.
  Honest terminal states for every failure (not-an-address, loading, cluster
  error, not-found, CAS missing/error, not-a-def) — never fallback content.
  poolPageConfigFromDef projects doc bands: §3 quote+notes, §4 list items,
  §10 receipt (numbers verbatim from doc bytes), §11 bold promise lines, §7
  fee sentence; kind-templated numberless defaults when a § is absent;
  §5 tier table + proof list single-sourced off the machine block.
- `pages/GenericPoolHero.tsx`: marketing block with kind-templated defaults
  (KIND_COPY, zero numerals), 1–3-tier picker (BladeHero slider >1 tier),
  usePoolJoin machine, CoveredOverlay/PolicyAcceptNote parity, share
  template with {name}/{event}/{fee}/{cap} tokens.
- `PoolPageShell`: optional `policyAddress` overrides the #policy band's
  mutual read (community pools have no data.ts listing; RawPolicyTerms
  itself unchanged). `registry.ts` + `main.tsx`: poolPageFor falls back to
  the generic page for unknown `#/m/<id>` route ids.
- Verified: `pnpm -r run build` exit 0, `pnpm lint` exit 0 (pre-existing
  warnings only), landing suite 46 files / 423 tests green incl. new
  GenericPoolPage.test.tsx; browser pass on the dev server (garbage-id and
  unknown-pubkey honest states; first-party pubkey routes render their
  hand-written pages). Changeset: minor. Live def-driven devnet pass is the
  tester bean's (riprap-vqoa) item.
- [x] Raw-policy band binds to the mutual's derived domain_ref (existing RawPolicyTerms, unchanged)
