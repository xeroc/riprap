---
# riprap-co8a
title: Final review against CLAIM-WIZARD.md spec + wrap-up
status: completed
type: task
priority: normal
assigned: implementer
created_at: 2026-09-22T14:00:09Z
updated_at: 2026-09-22T21:20:00Z
parent: riprap-lqra
---

## Final review — CLAIM-WIZARD.md vs milestone output `loyuxoov` (2026-09-22)

Reviewed every load-bearing clause of the spec against the shipped code
(`apps/landing/src/app/file-claim/` + `Recovery` + `AppPage` + router/llms/copy
doc), on the same base riprap-v7xe gate-verified (build/lint/test/anchor/cargo
all green; browser pass recorded in riprap-v7xe).

### Conformant (clause → evidence)

- **§2 Surface/routing**: `#/app/file-claim` case + `<title>` in `main.tsx:31-32`,
  lazy `entry.tsx`, router test (`main.test.tsx:53-56`), `llms.txt:14` entry,
  copy doc § `/app/file-claim` authored (lines 154+); wizard mounts kit-chrome
  only; emergency banner leads every step (`Wizard` renders `EmergencyBanner`
  above the step switch; copy matches doc line 160 verbatim; 999/112 in mono).
- **§3 Preflight**: exact spec order in `useClaimPreflight` (member → stake →
  pending → window → fee), fee is a live `fetchSubaccordMaybe` read — no
  constant; every block kind has its honest copy (doc line 161).
- **§4 Steps**: amount free-input with cap default on entry; five slots in
  policy §7 order (`CLAIM_DOCUMENT_PATHS`), same-person attestation gates
  continue; manifest built ONCE at step 4 (`enterManifest` — one buffer feeds
  preview, hash, signature, delivery); review restates fee economics + appeal
  ladder + proportional scaling (steps.tsx:431, 450, 615); synchronous
  manifest.yaml download rides the submit-start click (`FileClaimPage.tsx:550-555`,
  browser-gesture rule); filed screen carries the round timeline (steps.tsx:573).
- **§5 Manifest**: exact-bytes serializer with layout pinned by tests
  (`manifest.test.ts` — byte stability, canonical five paths, sha256
  provenance, fixed hanse-opt/v1 option block); `buildClaimManifest` returns
  buffer + hash together (never re-serialized).
- **§6 Publish**: dispute-first ordering (POST at :446 before the PUT loop);
  per-file independent ECIES, transient retry ×3, 409 terminal hard stop
  (:486-489); operator-down keeps the claim and leaves delivery retryable.
- **§7 Recovery**: `Recovery.tsx` gates on `sha256(manifest) ==
  Dispute.evidence_hashes[0]` (pure chain read) before any re-PUT; 409
  surfaced; POST is a 201 no-op.
- **§8 Operator**: program-metadata PDA resolution, once per session (hoisted
  hook :262-264), health-check + operator `name` shown on review/publish.
- **Draft law**: localStorage carries fields + hashes only; bytes stay in
  session memory (`fileBytes` ref, never persisted).
- **NEVER re-send after success**: `filed` gates `signAndFile` re-entry (:400)
  and `canSign` (:566).
- **Copy law**: rendered strings spot-checked verbatim against copy doc lines
  145/159/160/161 (wizard gate, banner, preflight states).

### One deviation — filed as riprap-s8jk (draft, needs a copy decision)

**Nonce race files a stale-dispute manifest.** `signAndFile`'s race branch
refetches the nonce, rebuilds the tx, and re-signs exactly once (conformant),
but the manifest is NOT rebuilt: the step-4 buffer embeds the STALE nonce's
`dispute`/`claim` PDAs, so the POSTed package and the member's downloaded
recovery artifact name a dispute that was never filed — §5's
"`dispute:` cross-checks == on-chain Dispute" fails on this path. The on-chain
hash stays self-consistent (tx + recovery both use the same buffer), so the
recovery gate holds; the blast radius is the juror-side cross-check and the
member's artifact accuracy, in the narrow window where another member files
between step 4 and tx land. The conforming fix needs a rebuild + re-download
flow plus a new copy-doc line (approval-gated), so it is recorded, not
silently patched in review. Not a blocker for the no-race path.

### Wrap-up state

- Gate: GREEN (riprap-v7xe record; `ACCORD_SO` prerequisite per pin law).
- Browser pass: done (riprap-v7xe record).
- AGENTS.md edges: done (riprap-17xq).
- Environment drafts: riprap-lsh4 (fresh-worktree anchor bootstrap),
  riprap-0udy (accord sBPFv3 artifact drift).
- Spec deviation draft: riprap-s8jk.
- Remaining §9 opens (personal representative, appeal-round evidence,
  retention sweep, curation discovery) are recorded in the spec itself as
  out-of-scope v1 — no action.

Verdict: milestone output conforms to CLAIM-WIZARD v1 except the one recorded
race-path deviation; fit to merge on top of the s8jk decision.
