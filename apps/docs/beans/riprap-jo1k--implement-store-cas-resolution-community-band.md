---
# riprap-jo1k
title: Implement store CAS resolution + community band
status: completed
type: task
assigned: implementer
priority: high
created_at: 2026-10-15T08:01:38Z
updated_at: 2026-10-15T08:01:38Z
parent: riprap-hs4r
---

- [x] `mutuals/store.ts`: unknown scan hits -> `seed`+`policyHash` off the decoded Mutual -> `domainRefHex` -> CAS GET -> def validation (riprap-def/v1) -> derived LiveMutual; 404 / hash mismatch / unknown schema dropped (state, never fallback content)
- [x] CAS fetch cached per domain_ref (react-query, long staleTime — bytes immutable)
- [x] Derived listing fields per milestone HANDOFF §4 (name, kind, slug, tagline = marketing.blurb || §3 excerpt, tiers with names, smallestPayout || cap range)
- [x] Community band on the mutuals directory below the founder list (no badges; first-party order untouched)
- [x] AGENTS.md Parts table + propagation edges (def module, CAS resolution, community band) in this change
- [x] `.changeset/*.md` minor (part of the epic's surface)

## Summary of Changes

- `mutuals/store.ts`: LiveMutual gains `def?`; unknown scan hits resolve via
  `resolveDef` (domainRefHex → CAS GET → client-side sha256-vs-policyHash →
  parseDefDoc); 404 / hash mismatch / non-def dropped fail-closed. Derivation
  via `useQueries` whose queryKey matches usePolicyDoc's exactly
  (["policy-doc", base, seed, hashHex]) with staleTime Infinity — one
  immutable-bytes cache shared by directory, generic page, wizard, and juror
  session. Founder order kept (RANK); community after, address-ordered (the
  creation-slot stand-in — the scan carries no slot; milestone open question
  documented in code).
- `MutualsPage.tsx`: community band — a labeled divider row below the
  founder rows in the same table; derived listings render badgeless
  (listingFromDef sets no badge), same row renderer.
- Derived listing fields: `def/listing.ts` (landed with bean riprap-8vue)
  — name/kind/slug, tagline = marketing.blurb || §3 first sentence, tier
  names, smallestPayout = marketing.smallestPayout || min cap.
- Tests: resolveLiveMutuals community path + ordering; useMutualStore CAS
  matrix (valid def listed with derived fields; 404 / hash mismatch /
  unknown schema each dropped); existing ready-test stubs the CAS 404.
  AGENTS.md: Parts row for the def module + a "Def module / community
  pools" propagation edge. Verified: build 0, lint 0, landing suite
  47 files / 440 tests green. Changeset: minor. Live devnet pass is the
  tester bean's (riprap-vqoa) item.
