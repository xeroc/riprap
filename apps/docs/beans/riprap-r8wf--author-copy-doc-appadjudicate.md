---
# riprap-r8wf
title: Author copy doc § /app/adjudicate
status: completed
type: task
assigned: implementer
created_at: 2026-09-25T08:53:10Z
updated_at: 2026-09-25T12:10:00Z
parent: riprap-w608
---

Author the copy-doc section FIRST (repo law): every board state, step title, gate, honest state, error string. Deadpan register, zero emoji, placeholders not constants. Checklist wording derives from policy §3/§4/§7. Spec §2–4, §8.

## Summary of Changes

Authored § `/app/adjudicate` in `meta/marketing/03-website-copy/landing-page.md` (lines 181–201): duty board + seven-step session wizard, ahead of string-bearing code per repo law.

- Every board state: entry-panel states (not staked / staked-not-drawn / drawn), serve panel (stake line, draw weight, `Stake to serve` with tier-contribution default + MST proof phases, fees earned + `Withdraw fees`), seat cards (phase clocks clock-derived, panel size + round, prior-round tally, terminal resolved/failed/final, `awaiting ruling`), loading/unreachable/not-live/non-member states reused verbatim from /app.
- Step titles: `PACKAGE · DOCUMENTS · POLICY · VERDICT · COMMIT · REVEAL · OUTCOME`; lock-step nav law (unverified evidence blocks documents, unanswered question blocks verdict).
- Gates + fails-closed strings: root gate, per-entry leaf gates, subaccord/filer cross-checks, 409 round-incomplete (honest pending), no-delivery-key, zero-slot no-evidence — all gate failures converge on terminal `Do not vote.` with one cause line each; not-your-seat honest state.
- Checklist wording from policy §3 (five coverage criteria), §4 (all ten exclusions, policy wording), §7 (slot descriptors, same-person cross-check, evidence-privacy line); yes/no/unsure valid, blank not.
- Placeholders not constants: every amount/clock/tally/hash is `{{PARAM}}` with a provenance line (min_stake ← subaccord read, fee ← tiers §5, windows ← EVENT-MUTUAL §12: 48h/12h/12h); Approve=0/Deny=1 cited to `file_claim.rs::option_label` (hanse-opt/v1).
- Persist/privacy behaviors (§8): localStorage keys, salt bridge + downloadable reveal code, bytes never persist, clock tick only while live.
- Dated amendment to the /app `#jurors` panel line: `Staking opens here.` retired — panel becomes the jury-duty entry to the new section.

Verification: banned-word sweep clean (messaging-guide avoid-list); markdown convention matched (single-line bullets); `pnpm lint` failures are pre-existing `noNonNullAssertion` in claim-wizard test files (`apps/landing/src/app/file-claim/Recovery.test.tsx`, `tests/src/spec-*.spec.ts`) — untouched by this change (edit is vault-side via the `meta/` symlink; biome checks no file this bean modified).
