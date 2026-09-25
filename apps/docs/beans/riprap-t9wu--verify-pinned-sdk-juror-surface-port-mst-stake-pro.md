---
# riprap-t9wu
title: Verify pinned SDK juror surface + port MST stake-proof worker
status: todo
type: task
assigned: implementer
created_at: 2026-09-25T08:53:10Z
updated_at: 2026-09-25T08:53:10Z
parent: riprap-w608
---

Verify pinned @useaccord/sdk exports (facade stake/commit/reveal/withdrawFees, findRoundPda + fetchMaybeRound, evidence subpath: verifyManifestHash, jurorDecrypt, sha256) — missing export = accord pin bump per AGENTS.md. Port the MST accumulator stake-proof Web Worker from accord apps/app features/juror/useStakingProof incl. root-mismatch retry. Spec §10.
