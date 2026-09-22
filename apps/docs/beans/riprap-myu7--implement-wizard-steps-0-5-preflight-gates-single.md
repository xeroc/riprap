---
# riprap-myu7
title: Implement wizard steps 0-5 + preflight gates (single-mutual seam, localStorage draft)
status: completed
type: task
assigned: implementer
created_at: 2026-09-22T14:00:09Z
updated_at: 2026-09-22T18:40:00Z
parent: riprap-5gud
---

## Summary of Changes

Wizard steps 0–5 of CLAIM-WIZARD v1 at `apps/landing/src/app/file-claim/` (7 modules + entry + smoke test), plus the supporting seams. Steps 6–8 (sign/publish/filed) intentionally left to riprap-yr3y; the review step ends at disclosures with no sign button.

- `useClaimPreflight.ts` — the §3 gate chain (member PDA → rights_stake via `fetchMaybeDepositorByOwner` → !has_pending → now < claims_close_at → fee ATA ≥ min_jury_size × fee_per_juror live subaccord read → SOL > 0), first failure wins, each kind maps to copy-doc state; pass carries the fee reads + `evidence_operator` for review/discovery.
- `draft.ts` — localStorage draft keyed by mutual, form fields + per-slot {sha256, fileName} only; corrupt drafts never crash.
- `documents.ts` — step-3 intake: MIME gate jpeg/png/pdf, 10 MiB cap (ADR-0031), WebCrypto sha256 of exact bytes, HEIC → JPEG via native `createImageBitmap` before hashing (ponytail: honest convert-elsewhere error instead of a decoder lib).
- `manifest.ts` — `riprap-claim/v1` deterministic serializer (CLAIM-WIZARD §5 field order, fixed hanse-opt/v1 option block) + one-buffer build whose sha256 feeds preview + future encryption. NOTE for riprap-7ym7: this implements the foundation-lane manifest module; your bean can align/extend (byte-stability tests are yours).
- `useEvidenceOperator.ts` — §8 discovery: program-metadata PDA (ProgM6JC…, seeds [accord, authority, "evidence-op\0…"]) → JSON {name,url,encryption_key} + /healthz ping, staleTime ∞ (once per session); ready for yr3y's publish step.
- `steps.tsx` + `FileClaimPage.tsx` — emergency banner (FIRST) leading every step, wallet gate, step rail stamps, steps 1–5 with disabled-until-complete Continue, step-2 cap default, step-4 single-buffer manifest + synchronous download on the continue gesture, step-5 review (fee economics, scaling, appeals, one-open-claim, operator line). Re-gates behind preflight if chain state moves mid-wizard.
- `#/app` entry (AppPage.tsx): `File a payout request` action rendered only while preflight passes; "This surface only reads." retired (copy doc amended same change); AppNavControls/ClusterSwitch/ConnectWalletButton exported for the wizard's reuse.
- Kit: new `Checkbox` (native input restyled, inline-SVG check in currentColor — no color literal escapes tokens.css) and `Textarea` (input law, multi-line) + stories + render tests.
- SDK seam: `@riprap/hanse` now re-exports `fetchMaybeDepositorByOwner`/`Depositor` and `tokenBalanceOrZero` (join.ts export) — single-source for the depositor read and the not-found→0 ATA balance contract.
- Copy doc (meta symlink → vault): § /app/file-claim amended with the two strings the section lacked (no-rights-stake gate, Attach/Replace controls) — every other rendered string was already authored there and renders verbatim.
- Test env fixes: Node-26 inert localStorage shadows jsdom's — memory-backed Storage stub in test-setup (localStorage only; sessionStorage left as-is because the covered overlay's session gate depends on it).

Verification: landing wizard/app/router suites 19/19 green; kit 177/177 (+ storybook build); pool 11, hanse 34, remotion 24, cli 105 green; `pnpm -r run build` + `pnpm lint` exit 0. Browser pass on the dev server (temp uncommitted route patch, reverted): route mounts, title swaps, gate copy verbatim, tokens law (#0c0e10/#f2efe8, Space Grotesk, 0px radius), platform route unaffected. Pre-existing red documented in draft bean riprap-8ys5 (BreakpointPage suite fails at parent revision with pristine tree); Rust legs untouched and baseline-blocked per riprap-ymdh.

Route wiring (main.tsx case, router test, llms.txt, index.html) deliberately NOT done — that is riprap-kic0's bean; `src/app/file-claim/entry.tsx` exists for it to mount.
