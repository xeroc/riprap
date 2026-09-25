---
# riprap-fy3q
title: 'Serve panel: stake CTA + withdrawFees'
status: completed
type: task
assigned: implementer
created_at: 2026-09-25T08:53:10Z
updated_at: 2026-09-25T13:05:00Z
parent: riprap-w608
blocked_by:
    - riprap-t9wu
    - riprap-jfb5
---

accord::stake with amount defaulted to member tier contribution (EVENT-MUTUAL §12) via the proof worker; fee-earned display + withdrawFees action. No unstake/reconcile (CLI). Spec §3.

## Summary of Changes

The serve panel's write actions (spec §3; copy doc § /app/adjudicate serve panel, strings verbatim):

- `apps/landing/src/adjudicate/ServeActions.tsx`:
  - **`Stake to serve`** — CTA reveals the amount form (kit Input/Label); amount defaults to the member's tier contribution (EVENT-MUTUAL §12 UX convention, helper line `Defaults to your tier contribution — {{fee}} USDC.` with the live tiers read); proof phases `Building your stake proof…` / `The stake tree moved — rebuilding the proof.` (the worker's mismatch retry, surfaced via a new `onRetry` callback on `useStakingProof`); send phases verbatim with the wizard's SIGN (`Building the transaction…` · `Waiting for your wallet…` · `Confirming…`); submit builds `accord::stake` through the `Accord` facade with the resolved StakingAccounts (accord `StakeActions.tsx` pattern: JurorStake PDA, both ATAs via the landing's `findAssociatedTokenAddress`, accordState) and the member's SAS attestation (§2.8 gated subaccord — `member.attestation` from the Member PDA); success invalidates the stake + seats reads and closes the form (the refreshed stake line is the feedback); failures toast `describeError` from program logs.
  - **`Withdraw fees`** — ungated `accord::withdrawFees` with fee accounts (feeToken from the live subaccord, JurorStake PDA, fee ATAs); disabled while `fees_earned == 0`.
  - No unstake / reconcile — CLI stays the operator path (spec §3).
- `AdjudicatePage.tsx` ServePanel wired to the actions (not-staked state → stake CTA; staked state → withdraw button beside the fees line); default amount + attestation passed from the Board's member + mutual reads.
- Tests `ServeActions.test.tsx` (6): CTA→form with tier-contribution default, mismatch-retry recovery (not an error state), stake submit (accounts + 20_000_000n micro amount + attestation asserted, shared send path, form closes), send-failure keeps the form open with the phase chain fully drained, withdraw disabled at zero, withdraw submit accounts. Cross-test async chains awaited (leakage lesson) and constructable `new` mock for the Accord facade.

Verification: `pnpm -r run build` ✓ · `pnpm lint` exit 0 ✓ · landing tests 181/187 green (the same 6 pre-existing copy-drift reds, drafts riprap-726h/riprap-q9u8); all 35 adjudicate-suite tests pass alone and under full-suite load. Live-chain send (real wallet signature) belongs to the Surfpool e2e lane, not jsdom — the instruction args and send seam are asserted at the mock boundary.
