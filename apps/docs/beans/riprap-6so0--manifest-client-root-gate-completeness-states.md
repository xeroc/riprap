---
# riprap-6so0
title: Manifest client + root gate + completeness states
status: todo
type: task
assigned: implementer
created_at: 2026-09-25T08:53:10Z
updated_at: 2026-09-25T08:53:10Z
parent: riprap-wxs8
blocked_by:
    - riprap-r8wf
---

GET /evidence/{dispute}/for/{juror} rounds index; manifest bytes from the juror-delivered out bundle (never the public endpoint); riprap-claim/v1 parser with golden-bytes test vs CLAIM-WIZARD §5; root gate verifyManifestHash vs Dispute.evidence_hashes[round]; cross-checks subaccord + filer; 409 = honest pending; fails-closed terminal do-not-vote. Spec §5.
