---
# riprap-6so0
title: Manifest client + root gate + completeness states
status: completed
type: task
priority: normal
created_at: 2026-09-25T08:53:10Z
updated_at: 2026-09-27T08:15:46Z
parent: riprap-wxs8
blocked_by:
    - riprap-r8wf
---

GET /evidence/{dispute}/for/{juror} rounds index; manifest bytes from the juror-delivered out bundle (never the public endpoint); riprap-claim/v1 parser with golden-bytes test vs CLAIM-WIZARD §5; root gate verifyManifestHash vs Dispute.evidence_hashes[round]; cross-checks subaccord + filer; 409 = honest pending; fails-closed terminal do-not-vote. Spec §5.

## Summary of Changes

- `apps/landing/src/adjudicate/package.ts` (new): step-0 package verification — `fetchJurorPackage()` = rounds-index GET `/evidence/{dispute}/for/{juror}` → routed round's delivered `out` bundle → `decryptDelivery` seam → root gate (SDK `verifyManifestHash` vs `Dispute.evidenceHashes[round]`) → `riprap-claim/v1` parser → subaccord/filer cross-checks. States: `verified` / `pending` (409-incomplete, `complete:false`, round-not-delivered, 5xx, transport) / `failed` (terminal do-not-vote: 4xx refusals, undecryptable, root mismatch, unparseable, cross-check mismatch, malformed index) / `no-evidence` (zero-slot, daemon never called). Strict line-grammar parser (`parseClaimManifest`) reuses the claimant builder's canonical paths (`CLAIM_DOCUMENT_PATHS`) and round-trips into `ClaimManifestInput`.
- `apps/landing/src/adjudicate/delivery.ts`: exported `errorText` (shared daemon-refusal mapping; no behavior change).
- `apps/landing/src/adjudicate/package.test.ts` (new): 19 tests — golden bytes vs the claimant suite's GOLDEN (parse + byte-exact `serializeClaimManifest` round-trip, dq-escape inverse), layout-drift/malformed-input rejections, and the full fetch matrix incl. wrong-key decrypt, tampered root, subaccord/filer mismatches, zero-slot, and the only-daemon-call-is-the-juror-index assertion (public manifest endpoint never on the juror path).
- Verification: adjudicate suite 69/69 green; `pnpm -r run build` green; `pnpm lint` exit 0 (0 errors). `pnpm --filter @riprap/landing run test` fails only on 6 pre-existing pool-page copy failures (ShareRow/BreakpointPage) verified red at the parent commit — recorded as draft bean `riprap-oq7r`, not this lane's scope.
