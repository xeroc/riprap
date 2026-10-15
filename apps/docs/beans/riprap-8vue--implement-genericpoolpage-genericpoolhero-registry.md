---
# riprap-8vue
title: Implement GenericPoolPage + GenericPoolHero + registry fallback
status: todo
type: task
assigned: implementer
priority: high
created_at: 2026-10-15T08:01:38Z
updated_at: 2026-10-15T08:01:38Z
parent: riprap-hs4r
---

- [ ] `mutuals/registry.ts`: route id not in POOL_PAGES -> GenericPoolPage (lazy)
- [ ] `pages/GenericPoolPage.tsx`: PoolPageShell with PoolPageConfig built from the def; doc bands from §-sections via def-format's sections.ts (definition/notes §3, exclusions §4, tier table §5, proof §7, end note §8; grades render from body prose)
- [ ] `pages/GenericPoolHero.tsx`: marketing block (headline, blurb, odds, share) with kind-templated defaults when absent; join flow on the existing usePoolJoin machine; {{PARAM}} until chain answers; CoveredOverlay + PolicyAcceptNote parity with hand-written heroes
- [ ] Raw-policy band binds to the mutual's derived domain_ref (existing RawPolicyTerms, unchanged)
