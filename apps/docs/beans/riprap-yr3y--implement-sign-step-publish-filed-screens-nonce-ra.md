---
# riprap-yr3y
title: Implement sign step + publish + filed screens (nonce-race retry, per-PUT retry)
status: completed
type: task
assigned: implementer
created_at: 2026-09-22T14:00:09Z
updated_at: 2026-09-22T19:20:00Z
parent: riprap-5gud
blocked_by:
    - riprap-myu7
---

## Summary of Changes

Wizard steps 6–8 (sign → publish → filed) on top of riprap-myu7's machine, plus the single-source instruction facade both the wizard and the CLI now share.

- `packages/hanse/src/claim.ts` — NEW build-only facade: `buildFileClaim` (signer-generic port of the CLI's local builder; dispute + accordState PDAs are caller-derived via @useaccord/sdk, so no new SDK dependency edge) and `juryFee` (u64-checked). CLI migrated to it (its local copy + FeeSource/FileClaimMutual types deleted, `await this.parse` fix rode along — oclif v4 needs it); `hanse.build.test.ts` re-pointed. One instruction assembly, no parallel implementations.
- `apps/landing/src/app/file-claim/evidence.ts` — the ADR-0031 transport client: `postManifest` (round-0 POST, 409 surfaced) + `putDocument` (independent ECIES via `@useaccord/sdk/evidence`'s claimantEncrypt — the installed 0.1.0 tarball already ships the /evidence export — per-file retry ×3 on 5xx/network, 409 terminal), `operatorPubFromKey` (hex | base58 → 32 bytes).
- `FileClaimPage.tsx` — the full machine: review's `Sign and file` → build (nonce = mutual.claimNonce) → wallet-signing → confirming via the shared `sendInstruction` seam; on a failed send the mutual is refetched — a moved nonce triggers exactly ONE rebuild + re-sign (`Another member filed first…` copy) and nothing else; `filed` state gates every re-entry (NEVER re-sent after success). Publish runs only after the landed tx: manifest POST first, then five per-file PUTs with live row status, 409 = hard stop (`The operator already holds a different file under {path}…`), operator-down after the tx surfaces the keep-manifest copy. Filed screen: `Filed — claim #{nonce}` stamp, Claim + Dispute chips (Accord dApp link is a recorded gap — no deployed dApp URL exists yet), `Evidence: delivered|incomplete — n of 5`, the round timeline, the fee note, and the manifest.yaml download; the draft clears on filing.
- `steps.tsx` — StepSign (phase lines + nonce-race copy), StepPublish (operator line, per-doc rows, conflict + unreachable states), StepFiled; review gains its `Sign and file` action.
- Tests: `evidence.test.ts` (real ECIES vs stubbed fetch: 201 shapes, per-PUT 5xx retry, 409 no-retry) + the wizard suite extended to 16 (happy path asserting ONE send + 6 fetches (POST + 5 PUTs) + filed facts + draft cleared; nonce race → exactly two sends and claim #1; PUT 409 hard stop; plain send-failure → toast + back to review, no second attempt).

Verification: file-claim suite 16/16, evidence 6/6, AppPage 9/9, router 4/4; workspace `pnpm -r run build` clean; `pnpm lint` exit 0; pool 11, ui 177, hanse 34, remotion 24, cli 105 all green. Browser pass (temp uncommitted route patch, reverted): route chunk loads, title swaps, gate copy verbatim, token law intact. Pre-existing BreakpointPage suite red remains documented in draft bean riprap-8ys5 (reproduced at the parent revision, untouched by this lane). Full sign/publish browser walk needs a Surfpool localnet + funded member — that's the lane's e2e pass after riprap-wwvc/riprap-vahh.

Route wiring (main.tsx case, router test, llms.txt) still deliberately riprap-kic0's; `src/app/file-claim/entry.tsx` mounts the page for it.
