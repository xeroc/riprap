---
"@riprap/landing": patch
---

Claim wizard publish step: the manifest is now the table's first row. `manifest.yaml` leads the "Delivering evidence" table — every other row's upload 404s until it lands, so it delivers first and carries its own Retry (re-posts itself alone; file rows re-post it first when it never landed). Row states replace the single "delivering"/"retrying" words with live phases: a 🔒 + spinner while the row's ECIES bundle encrypts, a spinner while it uploads, then `delivered`/`failed` (founder ask 2026-10-12 — the one emoji on the landing, an explicit exception to the zero-emoji law; the spinner stands still under prefers-reduced-motion). Also drops the dead imports the static-operator refactor left behind in `useEvidenceOperator.ts` (they broke the TypeScript build).
