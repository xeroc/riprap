---
# riprap-q9dr
title: 'Claim-filing wizard v1 — #/app/file-claim'
status: completed
type: milestone
priority: high
created_at: 2026-09-22T13:59:54Z
updated_at: 2026-09-24T06:59:20Z
---

The member-facing payout-request flow for the Blade Pool: wallet-gated wizard
at `#/app/file-claim` that collects the incident account + the five policy
proofs, builds a `riprap-claim/v1` manifest, sends one `hanse::file_claim` tx,
and delivers encrypted manifest + documents to the evidence operator
(ADR-0031 loose per-file transport — implemented in ../accord, milestone
`accord-5d0r`, not yet deployed). Spec of record: `meta/specs/CLAIM-WIZARD.md`
(grilled consensus 2026-09-22 — read it first; it supersedes anything here that
disagrees). Prerequisite already in the working tree: file_claim passes
`sha256(manifest)` through verbatim (EVENT-MUTUAL §7 amendment 2026-09-22).

## HANDOFF

### 1. Happy Path

1. Member connects wallet on `#/app`, preflight passes (Member PDA, rights_stake > 0, !has_pending, now < claims_close_at, fee ATA ≥ min_jury_size × fee_per_juror off the subaccord) → `File a payout request` action → `#/app/file-claim`
2. Steps: incident account → amount (free input, cap shown, default cap) → five document slots (canonical 01-ticket.pdf … 05-statutory-declaration.pdf, client sha256, MIME jpeg/png/pdf, HEIC converted before hashing) → manifest preview + synchronous manifest.yaml download → review (fee economics) 
3. Sign: `getFileClaimInstructionAsync` (nonce = mutual.claimNonce) via `sendInstruction`; nonce race (Claim-PDA init fails) → refetch nonce, rebuild, re-sign; NEVER re-send after success
4. Publish: `POST /evidence/{subaccord}/{dispute}/0` (ECIES manifest bundle) → `PUT /evidence/{subaccord}/{dispute}/0/{path}` per document (independent ECIES, per-file retry); all five 201 ⇒ derived-complete
5. Filed screen: claim PDA + dispute + timeline + keep-manifest.yaml copy; `#/app` claim detail gains evidence status + recovery re-entry (re-upload manifest → verify sha256(manifest) == dispute.evidence_hashes[0] → re-PUT docs)

### 2. Data Contract

- Manifest profile `riprap-claim/v1` — CLAIM-WIZARD.md §5 (exact fields; options = fixed recipe `hanse-opt/v1`, Approve=0/Deny=1, no filer salt)
- Evidence client: `claimantEncrypt` from `@useaccord/sdk/evidence`; operator discovery = `sub.evidence_operator` → program-metadata PDA (`ProgM6JCCvbYkfKqJYHePx4xxSUSqJp7rh8Lyv7nk7S`, seeds `[accord_program_id, operator_authority, "evidence-op\0\0\0\0\0"]`) → JSON {name, url, encryption_key}
- HTTP: ADR-0031 gate order — PUT 404 (no manifest) / 400 (untracked path, leaf-hash mismatch) / 409 (different hash stored) / 413 (caps); daemon config 64 entries, 10 MiB/doc, 100 MiB/package
- Modules: `apps/landing/src/app/file-claim/` (new), copy in `meta/marketing/03-website-copy/landing-page.md` § /app FIRST (every string quoted in the PR)
- New import edge for AGENTS.md Parts table: `@useaccord/sdk/evidence` into apps/landing (route chunk only)

### 3. Edge Cases & Constraints

- One serialized manifest buffer feeds preview + sha256 + encryption; never re-serialize. File bytes never persist in the browser (localStorage = form fields + doc hashes only). No web2 backend — documents live encrypted on the operator only. Two-door rule, deadpan register, zero emoji, mono numerals (DESIGN.md + messaging-guide). Policy §7: incomplete proof set ⇒ cannot file. Personal-representative filing is OUT (chain needs the member key — recorded gap, CLAIM-WIZARD §9)
- 999/112 emergency banner leads every step; fee display is a live chain read, never a constant

### 4. Business Logic

```
evidence_hash = sha256(utf8(manifest.yaml))            // exact bytes
fee = subaccord.min_jury_size × subaccord.fee_per_juror // live read
complete(files) = ∀ entries: stored(path) ∧ sha256 == entry.leaf  // daemon-derived; wizard = all PUTs 201
recovery gate: sha256(manifest) == dispute.evidence_hashes[0]      // pure chain read
```

### 5. Definition of Done

- [ ] Copy doc § /app + § #/app/file-claim authored; every rendered string quotes it
- [ ] Router case + `<title>` + router test + llms.txt entry + lazy entry.tsx
- [ ] Manifest module unit tests: byte stability, canonical five paths, option block
- [ ] Evidence client tests vs stubbed fetch: success, per-PUT retry, 409 conflict surfaced
- [ ] Mount + state-machine tests (preflight gates, sign phases, publish)
- [ ] Dev-server browser pass (mount, walk steps, verify sign/publish states) + `pnpm verify` green
- [ ] AGENTS.md Parts table gains the @useaccord/sdk/evidence edge

### 6. Test Matrix

- Given member w/ pending claim, When opening wizard, Then honest blocked state + link to open claim
- Given fee ATA under fee, When preflight, Then exact shortfall shown, no route entry
- Given nonce taken between build and land, When tx fails on Claim init, Then refetch + rebuild + re-sign, exactly once
- Given PUT 409 (different hash), When publishing, Then hard stop with wrong-document copy
- Given manifest re-upload matching dispute slot, When recovering, Then re-PUTs 201-no-op
- Given unknown-schema manifest, When daemon POST, Then 400 (never silent degrade — do not work around)

### 7. Open Questions

- Operator deployment (devnet/mainnet URLs + key) — `accord-5d0r` deploy pending; wizard resolves via metadata PDA, so only the PDA content changes. Assumption: operator live before devnet e2e week.
- Rep-filing policy gap — deferred (CLAIM-WIZARD §9), not a wizard blocker.

Closed 2026-09-24: all DoD items verified in tree (copy doc §/app + §#/app/file-claim, router + llms.txt, manifest/evidence/mount tests); dev-server browser pass + manual E2E attested by Fabian 2026-09-24. AGENTS.md evidence edge added (riprap-17xq).
