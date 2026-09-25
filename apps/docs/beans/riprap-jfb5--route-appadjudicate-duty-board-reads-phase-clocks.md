---
# riprap-jfb5
title: 'Route #/app/adjudicate + duty board reads + phase clocks'
status: completed
type: task
assigned: implementer
created_at: 2026-09-25T08:53:10Z
updated_at: 2026-09-25T12:45:00Z
parent: riprap-w608
blocked_by:
    - riprap-r8wf
---

Hash routes (main.tsx cases + title Riprap: Adjudicate, lazy src/adjudicate/entry.tsx, router tests, llms.txt), board: min_stake live read, drawn-seat discovery (claims nonce-scan x Dispute.currentRound -> round.jurors membership), clock-derived phases (window ends + commit count, never the state field), honest states, #/app entry panel. Spec §2–3.

## Summary of Changes

Routes + duty board for `#/app/adjudicate` (spec §2–3; copy doc § /app/adjudicate, riprap-r8wf — strings verbatim).

- Router (`src/main.tsx`): prefix match for `#/app/adjudicate` + session parse `#/app/adjudicate/:dispute/:round` (malformed/bare → board), `<title>` `Riprap: Adjudicate`, lazy `src/adjudicate/entry.tsx` (chain code out of the platform chunk); router tests + `public/llms.txt` entry.
- `src/adjudicate/` module: `phase.ts` (pure clock-derived phase — review/commit/reveal/awaiting-ruling from Round window ends, never the lagging state field), `useSeats.ts` (claims nonce-scan unfiltered × Dispute.currentRound × `round.jurors` membership; prior-round fetch for the round ≥ 1 tally; pure `drawnSeats`/`terminalLabel`/`tallyOf` — hanse-opt/v1: Approve=0/Deny=1), `useJurorStake.ts` (JurorStake PDA read: staked/feesEarned), `AdjudicatePage.tsx` (gate, shared mutual/membership states verbatim with /app, serve-panel read side + honest not-staked state, seat cards with stamp/panel-size/phase-clock/prior-tally/terminal + `Enter session` link, session shell with the single not-your-seat state for missing-or-not-drawn rounds).
- `#/app` entry panel: `JuryDutyPanel` (mechanic line + one entry state: not-staked + `Stake to serve` → board / staked-never-drawn / `Seat drawn for you.` + `Open jury duty`); `Staking opens here.` retired per the copy-doc amendment.
  Reuses `useMinStake` (live subaccord read) — no new number sources; every amount/clock/tally a chain read or `{{PARAM}}`.
- AGENTS.md: route list + cross-repo pin row + accord-pin-bump audit list updated with the new `@useaccord/sdk` import edges.

Verification: scoped gate per the AGENTS.md landing row — `pnpm -r run build` ✓, `pnpm lint` exit 0 ✓, `pnpm --filter @riprap/landing run test`: 169/175 green, all 43 tests in the touched suites (adjudicate ×3, main router, AppPage) pass; dev-server browser pass: gate/session/malformed/platform/app routes confirmed with title swaps. The 6 red tests are pre-existing copy drift in other beans' surfaces (ShareRow prefilled message + PoolHero odds table vs their tests and copy doc § Covered overlay / § pool page — emoji on the landing, dropped factual dissolve row), untouched by this diff (PoolHero's only change is biome formatting); tracked in draft beans riprap-726h + riprap-q9u8.
