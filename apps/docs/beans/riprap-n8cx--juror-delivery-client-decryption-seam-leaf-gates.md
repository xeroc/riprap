---
# riprap-n8cx
title: Juror delivery client + decryption seam + leaf gates
status: completed
type: task
assigned: implementer
created_at: 2026-09-25T08:53:10Z
updated_at: 2026-09-25T08:53:10Z
parent: riprap-wxs8
---

Per-file GET .../for/{juror}/{round}/{path}; decrypt only through a decryptDelivery seam (browser delivery key — founder interface, EXTERNAL, pending; step 0 gates on key presence with honest no-delivery-key state); leaf gate sha256(bytes) == entry.sha256 with URL/sentinel skip; per-doc states verified/pending/failed. Spec §5, §9.


## Summary of Changes

- `apps/landing/src/adjudicate/delivery.ts` — the juror per-file delivery client (spec §5): `fetchJurorDocument` (GET `/evidence/{dispute}/for/{juror}/{round}/{path}` → `DeliveredDocumentBundle`) mapping responses to per-document states `verified | pending | failed` (409 round-incomplete → pending, never an error; every other refusal fails closed; transport/5xx → retryable pending).
- The decryption seam: `DecryptDelivery` (`decryptDelivery(bundle) → bytes`) with `deliveryKeyDecrypt` — the daemon's strict-mode re-encryption (ADR-0034: native X25519 target, unchanged construction + HKDF `accord-deliver-v1`), composed from pinned `@useaccord/sdk/evidence` primitives (`x25519SharedSecret`/`hkdfSha256`/`aesGcmDecrypt` — all verified present at 0.1.0). Delivery-key custody via `DeliveryKeyStore` (localStorage default, fails closed on malformed); `currentDecryptDelivery` returns null without a key — the step-0 honest no-delivery-key gate while the founder registration interface (EXTERNAL, pending, §9) lands.
- Leaf gate: `verifyLeaf` (sha256(bytes) == entry.sha256, lowercase hex, composed in-app) with URL-path and all-zero-sentinel skip rules (`ZERO_SHA256`).
- `apps/landing/src/adjudicate/delivery.test.ts` — 15 tests: byte-exact seam round-trip against a locally-composed daemon encryption, wrong-key → failed, leaf match/mismatch, pending vs terminal 409 split, 404, 5xx/offline, skip rules, store + key-presence gate.
- Gate: `pnpm -r run build` ✓, `pnpm lint` exit 0 ✓, `vitest src/adjudicate` 15/15 ✓. Pre-existing red in the landing test leg (6 failures: ShareRow/BreakpointPage copy drift vs copy doc §144) tracked in draft bean `riprap-g9pe`; incidental fixes en route: unused `EMAIL_SUBJECT` import in `BlurbPage.test.tsx` (blocked the build leg) and a Biome reformat of `PoolHero.tsx`.