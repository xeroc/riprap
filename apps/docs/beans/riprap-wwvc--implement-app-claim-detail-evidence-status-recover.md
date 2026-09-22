---
# riprap-wwvc
title: Implement #/app claim-detail evidence status + recovery surface
status: completed
type: task
assigned: implementer
created_at: 2026-09-22T14:00:09Z
updated_at: 2026-09-22T20:10:00Z
parent: riprap-5gud
blocked_by:
    - riprap-vahh
---

## Summary of Changes

The #/app claim rows gain the evidence line + the recovery surface (CLAIM-WIZARD §7, copy doc § /app "Claim rows, evidence + recovery" — rendered verbatim).

- `file-claim/evidenceRecord.ts` — the local delivery record (`riprap:evidence:{mutual}:{nonce}`): the daemon's derived completeness is juror-gated (no public per-file listing, ADR-0031), so the member surface shows the browser's own record — all five paths recorded ⇒ `Evidence: complete`; unknown (CLI-filed, other browser) ⇒ honestly `incomplete`. Written by the wizard's deliverEvidence on completion and by the recovery flow; recovery re-delivery is idempotent either way.
- `file-claim/Recovery.tsx` — the recovery panel: manifest.yaml re-upload → `sha256(manifest) == Dispute.evidence_hashes[0]` (pure chain read via @useaccord/sdk's fetchDispute — the wrap is gone) → `Manifest verified against the claim — re-attach the five documents.` / mismatch: `This manifest doesn't match this claim.` → five re-attach slots (same intake gates: MIME/size/HEIC) → `Redeliver evidence`: manifest POST (201 no-op) + per-file PUTs with live row states, `retrying` on retry, 409 = the wrong-document hard stop, all delivered ⇒ recordDelivery + `Evidence: delivered`. Operator resolved per attempt via subaccord → program-metadata PDA.
- `AppPage.tsx` ClaimsBlock — every claim row gains `Evidence: complete|incomplete` (mono) and incomplete rows offer `Resume evidence delivery`, expanding the Recovery panel inline (one open at a time).
- Wizard's deliverEvidence records delivery on completion (the #/app line's source).
- Tests: `Recovery.test.tsx` (verify-match, foreign-manifest refusal, idempotent re-delivery with 1 POST + 5 PUTs + record, 409 hard stop); AppPage.test extended (incomplete line + Resume button; complete record ⇒ no Resume; localStorage cleared between tests); FileClaimPage.test's vahh-era recovery skip replaced with a pointer to the two real suites.

Verification: landing app suites 46/46 + wizard 22 (no skips left in either); landing build clean; `pnpm lint` exit 0; built-bundle browser pass on #/app (title swap, gate copy, token law). Pre-existing BreakpointPage suite red remains draft bean riprap-8ys5.
