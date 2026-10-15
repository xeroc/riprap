---
# riprap-jo1k
title: Implement store CAS resolution + community band
status: todo
type: task
assigned: implementer
priority: high
created_at: 2026-10-15T08:01:38Z
updated_at: 2026-10-15T08:01:38Z
parent: riprap-hs4r
---

- [ ] `mutuals/store.ts`: unknown scan hits -> `seed`+`policyHash` off the decoded Mutual -> `domainRefHex` -> CAS GET -> def validation (riprap-def/v1) -> derived LiveMutual; 404 / hash mismatch / unknown schema dropped (state, never fallback content)
- [ ] CAS fetch cached per domain_ref (react-query, long staleTime — bytes immutable)
- [ ] Derived listing fields per milestone HANDOFF §4 (name, kind, slug, tagline = marketing.blurb || §3 excerpt, tiers with names, smallestPayout || cap range)
- [ ] Community band on the mutuals directory below the founder list (no badges; first-party order untouched)
- [ ] AGENTS.md Parts table + propagation edges (def module, CAS resolution, community band) in this change
- [ ] `.changeset/*.md` minor (part of the epic's surface)
