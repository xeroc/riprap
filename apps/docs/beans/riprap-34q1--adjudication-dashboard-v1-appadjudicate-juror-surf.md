---
# riprap-34q1
title: 'Adjudication dashboard v1 — #/app/adjudicate (juror surface)'
status: completed
type: milestone
priority: normal
created_at: 2026-09-25T08:53:10Z
updated_at: 2026-09-27T10:05:06Z
---

Juror-facing adjudication surface for the mutual — the grilled-consensus spec
of record is `meta/specs/ADJUDICATION-DASHBOARD.md` (2026-09-25). One mutual
per cluster (static map), members-judge-members closed circle, mobile-first.
This HANDOFF inherits to every descendant task; the spec supersedes anything
here that disagrees.

## HANDOFF

### 1. Happy Path

1. Member connects wallet on `#/app` → jury-duty panel → `#/app/adjudicate` duty board.
2. Serve panel: stake to serve (`accord::stake`, default = member tier contribution, MST proof via Web Worker) + earned fees / `withdrawFees`.
3. VRF draw happens on-chain (passive); board lists drawn seats: claims nonce-scan (0..claim_nonce → Claim.dispute) × current Round → `round.jurors.includes(wallet)`.
4. Session `#/app/adjudicate/:dispute/:round`: juror delivery (`GET /evidence/{dispute}/for/{juror}`) → decrypt via browser delivery key → root gate `sha256(manifest) == Dispute.evidence_hashes[round]` → per-entry leaf gates.
5. Lock-step wizard: per-slot document review (blob URLs, native rendering) → policy checklist (yes/no/unsue, no blanks) → binary verdict (Approve=0/Deny=1, hanse-opt/v1 recipe).
6. Commit (32-byte salt, localStorage bridge + downloadable reveal code) → reveal one-click in the 12h window → outcome (tally, ruling, fee direction).

### 2. Data Contract

- Public surface: routes `#/app/adjudicate` + `#/app/adjudicate/:dispute/:round`; module `apps/landing/src/adjudicate/` (`entry.tsx`, `policy.ts`, `policies/blade-pool.ts`); `AdjudicationPolicy` interface = doc slots + coverage criteria + exclusions + verdict guidance, ZERO numbers.
- Modules touched: `apps/landing/src/main.tsx` (router cases + titles), `src/app/AppPage.tsx` (entry panel), `src/shared/{rpc,transaction}.ts` (reuse), `public/llms.txt`.
- External: evidence daemon juror routes; `@useaccord/sdk` facade (`stake`/`commit`/`reveal`/`withdrawFees`) + Round fetchers; `@useaccord/sdk/evidence` (`verifyManifestHash`, `jurorDecrypt`, `sha256`).

### 3. Edge Cases & Constraints

- Fails closed: any root/leaf mismatch = terminal "do not vote" — never a warning, never skippable. Round-incomplete (409) = honest pending state.
- Phases derive from clock time vs window ends + commit count — NEVER the lagging dispute state field.
- Decrypted bytes never persist (session memory, blob URLs revoked on exit); checklist answers + salt bridge persist (localStorage, dispute-scoped keys), cleared on outcome.
- The policy module carries NO numbers — every numeral is a chain read (kit data law); unit tests enforce with policy § citations.
- Non-drawn wallet on a session route = honest not-your-seat state; evidence never renders.
- Copy law: every string quoted from copy doc § `/app/adjudicate`, authored FIRST; deadpan register, zero emoji, mono numerals, no hex outside tokens.css.
- No unstake/reconcile (CLI), no appeal filing, no draw triggering, no subaccord browsing.

### 4. Business Logic

- Root gate: `sha256(manifest bytes) == Dispute.evidence_hashes[round]` (SDK `verifyManifestHash`); manifest bytes from juror-delivered `out` bundle, never the public endpoint.
- Leaf gate per entry: `sha256(bytes) == entry.sha256`; URL-path and all-zero-sentinel entries skip (riprap claims always carry real leaves).
- Manifest profile `riprap-claim/v1` (address-free): cross-check `subaccord == mutual.subaccord`, `filer == mutual PDA`; golden-bytes test vs CLAIM-WIZARD §5.
- Option labels: `H("hanse-opt" ‖ mutual ‖ index_le)`, Approve=0/Deny=1 (`file_claim.rs::option_label`).
- Stake default = member tier contribution (EVENT-MUTUAL §12); min floor from live subaccord read.

### 5. Definition of Done

- [ ] Copy doc § `/app/adjudicate` landed before string-bearing code
- [ ] Router cases + `<title>` + router tests + `public/llms.txt` entry
- [ ] Wizard gates: unverified evidence blocks review; unanswered checklist blocks verdict
- [ ] Fails-closed paths tested (root mismatch, leaf mismatch, incomplete round, cross-check failure, no delivery key)
- [ ] `AdjudicationPolicy` unit tests: zero-numbers rule + §3/§4/§7 citations
- [ ] Scoped `pnpm verify` green (landing legs per AGENTS.md gate table) + dev-server browser pass
- [ ] AGENTS.md Parts/propagation updated
- [ ] Lint clean, build green

### 6. Test Matrix (Given / When / Then)

- Given drawn seat + complete round, When session opened, Then steps 0–6 walk end-to-end; commit/reveal succeed on localnet.
- Given tampered manifest bytes, When step 0 runs, Then terminal "do not vote"; no document renders.
- Given 409 incomplete round, When session opened, Then honest pending state + retry.
- Given checklist with blanks, When verdict attempted, Then blocked; yes/no/unsure all pass the gate.
- Given commit done then reload, When reveal window opens, Then salt bridge restores reveal; given a different browser, Then only the downloaded reveal code works.
- Given round ≥ 1 seat, When session opened, Then prior-round tally + new-evidence delta shown.
- Given wallet not in round.jurors, When session URL opened, Then honest not-your-seat; no evidence fetched.

### 7. Open Questions

- Delivery-key registration interface (founder-provided, EXTERNAL, pending) — step 0 gates on it; wizard decrypts only through the `decryptDelivery` seam. Until it lands, end-to-end browser runs are blocked; ship seam + honest state first.
- Pinned `@useaccord/sdk` exports (facade methods, Round fetchers, `jurorDecrypt`) — verify at task A2; accord pin bump if missing (AGENTS.md propagation law).
- Fee read/withdraw mechanics at the pinned rev (accord `StakeActions.tsx:483` pattern).
