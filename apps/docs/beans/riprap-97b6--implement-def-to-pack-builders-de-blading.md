---
# riprap-97b6
title: Implement def-to-pack builders + de-blading
status: todo
type: task
assigned: implementer
priority: high
created_at: 2026-10-15T08:01:38Z
updated_at: 2026-10-15T08:01:38Z
parent: riprap-hs4r
---

- [ ] `mutuals/def/packs.ts` (pure): def -> ClaimFlow (documentSlots from proof; screenChecks kind-templated; manifestTitle from name + kind map; placeholders from §3; no emergency) and def -> AdjudicationPolicy (documentSlots with whatToVerify from verify?; coverageCriteria/exclusions kind-templated generic questions; samePersonRule/evidenceUseNote kind defaults; verdictNote template incl. tier-max clause)
- [ ] Derived listings resolve packs from the def, never the static registries (claimFlowFor / adjudicationPolicyFor gain the def path)
- [ ] De-blade: CLAIM_DOCUMENT_PATHS defaults deleted from app/file-claim/manifest.ts AND adjudicate/package.ts (slots always threaded from the resolved pack); DocumentsStep consumes pack.samePersonRule/evidenceUseNote; AdjudicatePage generic not-live copy (pool name interpolated); documents.ts url slots accept any https URL (x.com-only validator out; MIME gate stays global v1)
- [ ] Zero-numbers law holds in built packs
