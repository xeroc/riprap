---
# riprap-kctm
title: Chip-in state machine + balance pre-checks + toasts
status: completed
type: task
priority: high
created_at: 2026-09-17T14:05:49Z
updated_at: 2026-09-17T14:05:49Z
parent: riprap-wan9
blocked_by:
    - riprap-lqb0
    - riprap-da99
    - riprap-gced
---

idle→building→wallet-signing→confirming→covered per HANDOFF §4: render from getJoinContext; click → buildJoinInstructions → sendInstruction; deposit+SOL pre-check disable with inline reason (+Circle faucet link on devnet, 4zMM…); alreadyMember → Covered—{tier} stamp, slider locked, /app link; errors → describeError toast, back to idle. Copy from doc (D2).


## Summary of Changes

- `apps/landing/src/pool/sections/PoolHero.tsx` — the hero state machine (idle → building → wallet-signing → confirming → covered): click runs `buildJoinInstructions` then `sendInstruction` (one tx, one signature); alreadyMember/confirmed renders the `Covered — {tier}` BadgeStamp with the slider locked and the /app link; any throw → `toast.error(describeError(err))` (unmapped fallback `The transaction didn't go through. Try again.`), back to idle with the join context refetched. No-wallet CTA `Connect a wallet to chip in` opens the kit WalletDialog wired to ConnectorKit hooks; the waitlist dialog is gone from the hero. Copy verbatim from landing-page.md § "On-chain states + juror modal".
- `apps/landing/src/pool/useJoinContext.ts` — new TanStack query over `getJoinContext` (enabled only with wallet + mutual address; cached by endpoint/mutual/wallet).
- `apps/landing/src/pool/sections/JoinPrecheck.tsx` (+ test) — the inline disable reasons: `Not enough USDC. This wallet holds {{balance}}; the {{tier}} tier costs {{fee}}.` (per-SELECTED-tier affordability, chain-sourced mono numbers), `You'll also need SOL for network fees.`, and the devnet-only `Get devnet USDC from the Circle faucet.` link.
- `apps/landing/src/shared/transaction.ts` — optional `onSubmitted` seam on `sendInstruction` (fires between clean simulation and broadcast — the Confirming… transition); tested both ways.
- `packages/ui/src/components/index.ts` — export `BadgeStamp` (the Covered stamp atom; component + stories already existed, export was missing).
- `apps/landing/package.json` — add `sonner` (toast surface already shipped by the kit's Toaster).
- Tests: BreakpointPage suite extended to 16 (phases, covered stamp, pre-checks incl. per-tier tracking, failure toast + refetch, connect CTA); landing 49/49; `pnpm verify` green; platform entry bundle still @solana/*-free.