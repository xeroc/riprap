---
# riprap-4sz5
title: Document viewer + per-slot screens + same-person cross-check
status: completed
type: task
assigned: implementer
created_at: 2026-09-25T08:53:10Z
updated_at: 2026-09-25T08:53:10Z
parent: riprap-wxs8
blocked_by:
    - riprap-6so0
    - riprap-n8cx
---

One screen per AdjudicationPolicy slot: blob-URL rendering (images inline, PDF open-in-tab, download button, URLs revoked on exit), seen+legible+in-slot ticks, same-person cross-check (ticket = ID = declaration = member). Copy from copy doc. Spec §4, §6.

## Summary of Changes

- `apps/landing/src/adjudicate/DocumentsStep.tsx` (new): step 1 DOCUMENTS — one screen per policy §7 slot in order (`DocumentSlot` = path + verify + step-0-verified bytes, props from the session shell / AdjudicationPolicy pack), `DocumentViewer` implements the §6 viewing model (blob URL per screen: images inline, PDFs via `Open document` new-tab + `Download` for both; every URL revoked on screen exit and unmount; bytes never persist), three unticked gates `Seen`/`Legible`/`In the right slot` gating forward movement (back free), closing same-person cross-check screen (`Same person throughout`), privacy line on every screen. §8 persistence: tick answers in `localStorage` keyed `(mutual, dispute, round)` via `documentsAnswersKey`, `clearDocumentsAnswers` for the outcome screen, corrupt-draft-safe load.
- `apps/landing/src/adjudicate/DocumentsStep.test.tsx` (new): 11 tests — copy-doc strings pinned (slot paths, verify lines, gates, cross-check line, privacy line), forward gating + back-free navigation with tick retention, viewing model (inline img from blob URL for jpg, Open document/Download for pdf, `window.open` new-tab contract, revoke on screen exit + unmount, localStorage never holds bytes), cross-check reachability + onDone gating, and the §8 persistence matrix (remount restores, clear empties, corrupt JSON fails safe).
- Verification: adjudicate suite 80/80 green; `tsc -b` clean; `pnpm -r run build` green; root `pnpm lint` exit 0. Landing-wide test leg still carries the 6 pre-existing pool-page failures tracked in draft bean `riprap-oq7r` (verified red at the parent commit, unrelated to this lane).
