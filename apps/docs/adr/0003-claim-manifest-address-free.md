---
status: accepted
---

# 0003 — The claim manifest is address-free (nonce-invariant `riprap-claim/v1`)

Decided 2026-09-23, on top of the riprap-s8jk fix. `riprap-claim/v1` (CLAIM-WIZARD §5) drops its `dispute:` and `claim:` lines: the payout-request manifest carries who (member/filer/subaccord/mutual), what happened (title, claim_context), and the five evidence hashes — never chain addressing. The dispute and claim PDAs derive from the claim nonce and stay tx-side only.

## Why

Nobody that reads the manifest used those lines:

- **Recovery** (`apps/landing/src/app/file-claim/Recovery.tsx`) hash-compares the uploaded bytes against `dispute.evidence_hashes[0]`; the dispute/claim it verifies for come from the on-chain claim row. The sha256-vs-slot comparison IS the binding — an embedded address adds no cryptographic strength.
- **The evidence daemon** (accord ADR-0031 transport) receives an ECIES ciphertext bundle; it routes on the URL (`/evidence/{subaccord}/{dispute}/{round}`) and checks `plaintext_hash`. It cannot read the yaml at all.

Meanwhile embedding them coupled the member's durable artifact to chain addressing: a filing race (another member's `file_claim` bumps `claim_nonce` between our build and our send) changed both PDAs, forcing the manifest bytes, the on-chain `evidence_hash`, the operator POST, and the already-downloaded recovery file to all be rebuilt and re-downloaded mid-signing (the riprap-s8jk machinery). The step-4 download exists precisely because it must precede signing (browser-gesture rule); invalidating it at signing defeated its purpose.

## Decision

- `ClaimManifestInput` and the serializer (`manifest.ts`) carry no `dispute`/`claim` fields; the byte layout is law, pinned by the GOLDEN in the manifest suite.
- The wizard keeps ONE buffer `{yaml, sha256}` built at step 4; a nonce race rebuilds only the tx at the fresh nonce and re-signs the SAME buffer — evidence hash, POST, and the member's download are valid regardless of how many races happen before the tx lands.
- `filed_at` stays the step-4 build stamp (informative, per §5's claim_context note).

## Consequences

- CLAIM-WIZARD §5 profile updated accordingly; the manifest test suite's GOLDEN and variant list move with it.
- A juror eyeballing the decrypted manifest no longer sees the dispute address inline; they derive it from the claim they rule on. Zero security delta — hash-match proves manifest↔dispute.
- The riprap-s8jk fix's rebuild/re-download machinery and its copy line are deleted; the race test now asserts the buffer and download NEVER change across a race and both sends carry the same evidence hash.
