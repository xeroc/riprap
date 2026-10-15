---
"@riprap/landing": minor
---

Def-built packs and de-blading: claimFlowFor and adjudicationPolicyFor accept
a pool's anchored riprap-def/v1 doc and build the ClaimFlow and
AdjudicationPolicy from it (new mutuals/def/packs.ts — kind-templated
screens and criteria, doc-derived exclusions, zero template numerals,
claimant/juror slot parity by construction). The claim wizard and restore
route resolve community pools' defs on-chain; the juror session resolves
pack-less pools' defs before its no-policy verdict. De-blading:
CLAIM_DOCUMENT_PATHS defaults deleted — serialize/parse/fetchJurorPackage
thread the pack's slot list always, so no pool can silently serialize
another pool's canonical set; DocumentsStep renders the pack's same-person
rule and evidence-use note; the duty board's not-live copy is pool-agnostic;
url slots accept any https link.
