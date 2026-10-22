---
# riprap-2kz6
title: 'Implement #/create deploy + publish + verify steps'
status: completed
type: task
assigned: implementer
priority: high
created_at: 2026-10-15T08:01:52Z
updated_at: 2026-10-15T15:35:00Z
parent: riprap-gob1
blocked_by:
    - riprap-xf0n
---

- [x] Deploy: build initialize_mutual via `@riprap/hanse` (same sendInstruction seam as join/claim); wallet signs; rent + fees shown before sign; honest failure states (one-line log reads, describeError mapping)
- [x] Publish: hash-gated CAS PUT of the exact doc bytes at the derived domain_ref (RawPolicyTerms proof-mode path, creator-side); 400/404/409 deadpan lines; explicit skip state (mutual live, doc unpublishable until PUT)
- [x] Verify: GET round-trip against the ref; link to the pool page (def-resolution surfaces); share row
- [x] AGENTS.md map edges for #/create in this change
- [x] `.changeset/*.md` minor

## Summary of Changes

- `create/steps.tsx`: DEPLOY (wallet gate → mirrored-gate block with the
  first drawer rejection → review with frozen anchors + the honest cost
  line — the wallet's own confirm is the exact number, no estimate invented
  → build/send phases → describeError one-liner + Try again), PUBLISH
  (facts row, PUT with deadpan 400/404/409/unreachable lines + Retry,
  explicit Publish later + the pool-page terms-panel recovery note), VERIFY
  (GET read-back, sha256 match/mismatch/unreachable, Open the pool page →
  `#/m/<mutual>`, Copy link, Done resets the machine on a blank draft).
- `create/deploy.ts` (pure, fetch as a test seam): putDocument/verifyDocument
  (proof-mode query `subaccord+preimage+offset=23`, exact-bytes PUT as Blob,
  sha256 read-back compare), publishFailureLine mapping, preimageHex (the
  single-source hansePreimage), subaccordArgs/windowArgs/tierArgs (hours →
  seconds, USDC → raw, def tiers padded to [Tier; 3], empty operator → the
  creator's wallet per EVENT-MUTUAL §7 v1).
- CreatePage: Step machine extended to author→preview→deploy→publish→verify;
  preview gains Continue to deploy (disabled until anchors land); the
  deployed record freezes signature/mutual/subaccord/seed/ref/hash/doc at
  confirm, clearDraft() rides the confirm, Done reseeds on a blank draft.
- Copy: § /create DEPLOY/PUBLISH/VERIFY lines authored in the copy doc in
  the same change (rent line deliberately qualitative — house pattern from
  the claim wizard; the operator-empty helper corrected to the creator's
  wallet, the v1 on-chain note). AGENTS.md #/create map edge extended with
  the deploy/CAS-PUT path.
- Tests: deploy-half describe in CreatePage.test.tsx — mirrored-gate block,
  wallet gate, one initialize_mutual with derived args (tiers padded,
  operator fallback, deposits timestamp) + draft cleared, faithful-daemon
  PUT/GET round-trip with URL/proof-mode assertions + pool-page link, 409
  conflict line + Publish later → verify. Scoped gate: pnpm -r run build
  exit 0 · pnpm lint 0 errors (new warnings: none beyond the author-pass
  positional-key pair) · landing suite 444/444.
- Devnet browser pass (the milestone DoD end-to-end) belongs to the epic's
  verify bean / dogfood task, not this implement bean.
