---
# riprap-2xug
title: 'Commit/reveal: salt bridge, reveal code, outcome screen'
status: completed
type: task
assigned: implementer
created_at: 2026-09-25T08:53:11Z
updated_at: 2026-09-27T11:26:00Z
parent: riprap-x58j
blocked_by:
    - riprap-8sra
---

Steps 4–6: commit (32-byte salt, commitment ix, localStorage bridge keyed dispute/round/juror, downloadable mono reveal code), reveal one-click with early unlock when all seats committed, outcome screen (per-seat reveals, tally, ruling, fee direction), checklist cleared on outcome. Spec §4, §8.

## Summary of Changes

- `apps/landing/src/adjudicate/vote.ts` — pure §8 machinery: the salt bridge
  (`saltBridgeKey` keyed (dispute, round, juror) — the accord Voting.tsx
  convention — save/load failing to null on corruption), the self-describing
  mono reveal code (`encodeRevealCode`/`parseRevealCode`; salt 64-hex +
  choice 0/1, fails closed on any mismatch), `randomSalt` (32 local bytes),
  and `revealOpen` — the window gate mirroring the chain (clock vs window
  ends + commit count, early unlock when every seat committed; never the
  lagging dispute state field).
- `apps/landing/src/adjudicate/CommitStep.tsx` — step 4 COMMIT: intro/send
  phases verbatim, `accord::methods.commit` through the shared
  simulate-then-send path, bridge saved when the commitment is sent
  (crash-safe, accord convention), committed view with the mono reveal code
  block + `Download reveal code` + keep line.
- `apps/landing/src/adjudicate/RevealStep.tsx` — step 5 REVEAL: window line
  while closed, one-click `Reveal vote` from the bridge, the cross-browser
  `Reveal code` field + `Reveal` (parse validates the seat — a code minted
  for another seat never sends), `Vote revealed.`
- `apps/landing/src/adjudicate/OutcomeStep.tsx` — step 6 OUTCOME: per-seat
  reveal rows (recipe labels, NO_VOTE → dash), mono tally via `tallyOf`,
  ruling stamps past tense (`Approved`/`Denied` per copy doc § step 6 —
  distinct from the option labels), fee direction verbatim with the wizard's
  REVIEW, `This seat paid {{fee}} USDC.`, conditional slashing line, closing
  retention line; on mount clears the documents ticks + checklist answers +
  salt bridge (§8).
- Tests: `vote.test.ts` (bridge roundtrip/fails-null, code roundtrip/fails
  closed, gate geometry incl. early unlock), `CommitStep.test.tsx` (send
  accounts+args, bridge consistency with the committed salt, committed view,
  phases), `RevealStep.test.tsx` (gate, one-click preimage, cross-browser
  code path, wrong-seat code never sends), `OutcomeStep.test.tsx` (rows,
  tally, stamps + {{PARAM}}, economics, conditional slashing, §8 clear).
- Off-scope lint repair riding along: `tests/src/spec-d-appeal.spec.ts`
  non-null assertions → optional chaining (landed red via the cross-epic
  merge; `pnpm lint` is a required leg of this gate). One new string needs
  copy-doc ratification: the reveal-code mismatch toast `This reveal code
  doesn't match this seat.` (not in copy doc § step 5 — flagged for the
  next copy-doc pass).
- Scoped gate: `pnpm -r run build` (8/8), `pnpm lint` (0 errors),
  `@riprap/landing` 302/302.
