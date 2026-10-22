---
# riprap-97b6
title: Implement def-to-pack builders + de-blading
status: completed
type: task
assigned: implementer
priority: high
created_at: 2026-10-15T08:01:38Z
updated_at: 2026-10-15T08:01:38Z
parent: riprap-hs4r
---

- [x] `mutuals/def/packs.ts` (pure): def -> ClaimFlow (documentSlots from proof; screenChecks kind-templated; manifestTitle from name + kind map; placeholders from §3; no emergency) and def -> AdjudicationPolicy (documentSlots with whatToVerify from verify?; coverageCriteria/exclusions kind-templated generic questions; samePersonRule/evidenceUseNote kind defaults; verdictNote template incl. tier-max clause)
- [x] Derived listings resolve packs from the def, never the static registries (claimFlowFor / adjudicationPolicyFor gain the def path)
- [x] De-blade: CLAIM_DOCUMENT_PATHS defaults deleted from app/file-claim/manifest.ts AND adjudicate/package.ts (slots always threaded from the resolved pack); DocumentsStep consumes pack.samePersonRule/evidenceUseNote; AdjudicatePage generic not-live copy (pool name interpolated); documents.ts url slots accept any https URL (x.com-only validator out; MIME gate stays global v1)
- [x] Zero-numbers law holds in built packs

## Summary of Changes

- `mutuals/def/packs.ts` (pure): buildClaimFlow + buildAdjudicationPolicy —
  slots single-sourced off the def's proof list (url kind marks the url
  slot; verify? feeds whatToVerify with a generic default), kind-templated
  screens/criteria (mutual vs bounty word maps), doc-derived §4 exclusions,
  manifestTitle from name + kind map, no emergency, verdictNote carries the
  tier-max clause. Zero template numerals; slot parity between the two packs
  by construction (pinned by packs.test.ts).
- Registries: claimFlowFor / adjudicationPolicyFor take an optional
  RiprapDef — def wins, static ids unchanged, null without either.
- New `mutuals/def/usePoolDef.ts` (shared resolution hook: useMutual →
  usePolicyDoc → parseDefDoc, honest states); GenericPoolPage refactored
  onto it; FileClaimPage's Wizard AND RestoreSurface resolve community
  pubkeys' defs (honest resolving gate, invalid fallback unchanged);
  AdjudicatePage's session split into PoolSession which def-resolves
  pack-less pools before the no-policy verdict; board not-live copy is
  pool-agnostic now.
- De-blading: CLAIM_DOCUMENT_PATHS + ClaimDocumentPath deleted;
  serializeClaimManifest / buildClaimManifest / parseClaimManifest /
  fetchJurorPackage take slots as a required parameter (tests thread the
  blade pack's paths); DocumentsStep renders samePersonRule/evidenceUseNote
  from the pack (SessionWizard threads them); intakeUrl accepts any https
  URL (plain http refused; x.com-only gate and copy gone).
- Verified: pnpm -r run build exit 0, pnpm lint exit 0, landing suite
  47 files / 434 tests green (incl. new packs.test.ts, 11 tests; updated
  blade parity tests, url-slot gate test both directions, no-policy test
  awaits the def roundtrip). Changeset: minor.
