---
# riprap-00b7
title: 'Polish #/create wizard: type-driven steps + event-mutual messaging clarity'
status: completed
type: task
priority: normal
tags:
    - landing
    - copy
created_at: 2026-10-21T12:26:05Z
updated_at: 2026-10-21T12:54:03Z
---

Per founder (2026-10-21, post kitty design session): wizard copy must make clear the two authorable types are event-specific (narrow time-windowed) mutuals — ONE deposit during funding, payouts only per the specified datetimes, unspent remainder returned to depositors. Type from step 1 governs which steps follow. kitty NOT in scope. Copy doc FIRST (meta/marketing/03-website-copy/landing-page.md), then code; ≤2-sentence explainer under each step headline; deadpan register; no banned words.

## Summary of Changes

- Every authoring screen opens with a ≤2-sentence mechanism explainer (event-scoped, one payment while joining is open, payouts only per the authored dates, unspent remainder returned): CreatePage.tsx identity/tiers/window/terms/marketing/advanced screens.
- Copy doc § /create updated FIRST (register amended to allow mechanism framing, never peril/numbers), reconciled drift: bounty Roster field documented as retired (rides body prose, draft.ts migrates), terms-field note aligned to code, proof band helper moved to the proof band, derived rows say requests close.
- AUTHOR_PHASES rail commented as the kind seam (both kinds walk the same six screens; an ongoing kind diverges there) — kitty groundwork only, not implemented, per scope.
- Test: per-screen explainer regression (CreatePage.test.tsx).
- Verified: build green, lint 0 errors, create suite 67/67, browser visual check (#/create walked identity→terms, explainers render verbatim).
- Note: a parallel founder pass (claim→request vocabulary) landed mid-session and reworded the explainers + rail labels (Tiers/Terms); doc and changeset synced to it. File-claim suite failures at session time stem from that in-flight pass's edited files, not this change; not committed (working copy shared with the in-flight pass).
