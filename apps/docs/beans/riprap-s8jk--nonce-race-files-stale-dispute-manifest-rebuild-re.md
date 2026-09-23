---
# riprap-s8jk
title: 'Nonce race files stale-dispute manifest: rebuild + re-download flow (CLAIM-WIZARD §5 cross-check)'
status: done
type: bug
created_at: 2026-09-22T18:52:23Z
updated_at: 2026-09-23T12:54:00Z
---

Final-review finding (riprap-co8a) on milestone loyuxoov: FileClaimPage.signAndFile rebuilds the tx at the fresh nonce on a nonce race, but the manifest stays the step-4 buffer whose dispute/claim PDAs were derived from the STALE nonce. On-chain evidence_hash stays self-consistent (recovery gate holds), but the POSTed manifest content and the member's downloaded manifest.yaml name a dispute that was never filed — CLAIM-WIZARD §5 'dispute: cross-checks == on-chain Dispute' fails on this path, and the step-4 preview the member saw no longer matches the filed claim. Fix: rebuild the manifest at the fresh nonce inside the race branch (thread the rebuilt buffer through attemptSign/deliverEvidence — they close over the stale state), re-trigger the synchronous download, extend the nonce-race test to assert the second send carries the rebuilt hash and manifest.dispute == the landed dispute. Requires a new copy-doc line for the rebuilt-manifest moment (copy law: Fabian approves) — update meta/marketing/03-website-copy/landing-page.md § /app/file-claim FIRST. Narrow window (another member files between step 4 and tx land); not a launch blocker for the no-race path.
Superseded 2026-09-23 by ADR-0003 (address-free manifest): the race no longer rebuilds the manifest — it re-signs the SAME buffer at the fresh nonce; the re-download and its copy line were removed, and the step-4 download is durable regardless of races.
