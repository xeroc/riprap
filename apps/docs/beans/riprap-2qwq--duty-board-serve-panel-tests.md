---
# riprap-2qwq
title: Duty board + serve panel tests
status: completed
type: task
assigned: tester
created_at: 2026-09-25T08:53:10Z
updated_at: 2026-09-25T13:15:00Z
parent: riprap-w608
blocked_by:
    - riprap-fy3q
---


## Summary of Changes

Test coverage for the duty board + serve panel (HANDOFF §6), consolidated across the lane's beans and completed with the entry-panel gating states:

- **Honest states** — `AdjudicatePage.test.tsx` (12): jury gate copy, not-live, not-a-member (closed circle), staked-never-drawn, drawn-seat card bindings (stamp, panel size, clock phase, `Enter session` href), prior-round tally, terminal seat (concluded — final, no CTA), awaiting-ruling, not-staked serve state, session not-your-seat (not drawn + round missing), session round shell.
- **Phase derivation** — `phase.test.ts` (5): the clock-vs-window-ends matrix (review/commit/reveal/awaiting-ruling, boundary instants included), citing spec §2's never-the-state-field law. `commitCount` is deliberately NOT an input to the board clock — the board renders window ends only; the commit-count-driven early unlock is the wizard step-5 gate (§4, later bean). Recorded here so the next bean doesn't re-derive it.
- **Entry-panel gating** — NEW in `AppPage.test.tsx` (+3, 14 total): not-staked → `Stake to serve` links `#/app/adjudicate`; staked-never-drawn → `No seat drawn for you.` + stay-in-draw line, no CTA; seat drawn → `Seat drawn for you.` + `Open jury duty` link. Mocked accord fetchers extended (JurorStake/Dispute/Round) with `as never` shapes.
- **Serve action wiring** — `ServeActions.test.tsx` (6, landed with riprap-fy3q): stake form (tier-contribution default §12, attestation + micro amount asserted through the mocked `Accord` facade, shared send path, form-close on success, phase chain drained), mismatch-retry recovery, send-failure, withdraw-fees disabled/enabled + accounts. Plus `useStakingProof.test.tsx` (6) and `useSeats.test.ts` (pure: membership, terminal labels, hanse-opt/v1 tally).

Verification: `pnpm -r run build` ✓ · `pnpm lint` exit 0 ✓ · landing suite 184/190 green — the 6 reds are the pre-existing copy drift in ShareRow/PoolHero (drafts riprap-726h + riprap-q9u8, untouched by this lane's diffs).
Mount tests: honest states, phase derivation off window ends + commit count, entry-panel gating, serve action wiring with mocked facade. HANDOFF §6.
