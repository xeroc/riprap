---
# riprap-djgb
title: CLI hanse reads + pure quote
status: completed
type: task
tags:
    - ts
    - cli
    - tdd
created_at: 2026-09-01T23:29:35Z
updated_at: 2026-09-15T12:10:00Z
parent: riprap-pobu
blocked_by:
    - riprap-izow
---

Read-only + pure commands completing the hanse topic:
- hanse:show --mutual: phase, ratio_1e9, obligations, fee_refunds, claims counters, deposits_close_at/claims_close_at/pull_close_at, pool + subaccord links, live treasury balance.
- hanse:claim --claim: status, claim_amount, fee_paid, dispute, member, filed/settled timestamps.
- hanse:member --mutual [--member <addr> else wallet]: tier (with contribution/max-payout resolved from Mutual.tiers), has_pending.
- hanse:quote (PURE, offline — the accord accumulator:* pattern): --claim-amount --fee-paid --treasury --obligations --fee-refunds -> ratio_1e9, payout, burn amount min(payout, contribution) given --contribution; prints the §8 worked example as a test fixture (2,000 + 15 at ratio 1; 1,323.40 + 9.93 at the 15-claim ratio). Cites EVENT-MUTUAL §8 in help text.
Tests: decoded-account render fixtures; quote exact-number tests vs §8 (integer base units, floor semantics documented).


## Summary of Changes

- `apps/cli/src/commands/hanse/show.ts` — `hanse:show --mutual`: buildMutualView (pool:show pattern) — phase, frozen ratio_1e9, obligations + fee_refunds, claims filed/resolved, all three deadlines (ISO), pool + subaccord + mints, live treasury balance via getTokenAccountBalance.
- `apps/cli/src/commands/hanse/claim.ts` — `hanse:claim --claim`: decoded Claim dump (status label map incl. every ClaimStatus variant, clamped amount, fee paid, dispute/member links, filed/settled; settled_at 0 renders "—").
- `apps/cli/src/commands/hanse/member.ts` — `hanse:member --mutual [--member|wallet]`: buildMemberView resolves the tier index against Mutual.tiers (contribution + max payout) and the pending-claim gate.
- `apps/cli/src/commands/hanse/quote.ts` + `src/lib/hanse-quote.ts` — PURE offline quote (BaseCommand, no rpc/keypair): settlementRatio = settle_pool.rs §2.5 (denominator 0 ⇒ 1e9, else min(1e9, floor)), payout = claim_payout.rs (each term floored), burn = min(payout, contribution). Help text cites EVENT-MUTUAL §8 with the worked example.
- tests: 100 CLI tests green — hanse.reads (encoded mutual/member/claim fixtures over the structural rpc mock), hanse-quote exact §8 integers (solvent: ratio 1e9, payout 2_015_000_000, burn saturates at 20_000_000; exhausted: ratio 661_703_887, 1_323_407_774 + 9_925_558 = 1_333_333_332 — §8's $1,323.40/$9.93 are the prose roundings, comments document the two-stage floor semantics), quote CLI subprocess run offline, help lists all twelve hanse commands.
- `pnpm verify` green (build, biome, vitest, anchor build, cargo test).

Checklist:
- [x] 4 commands + tests green; quote matches §8 to the base unit
