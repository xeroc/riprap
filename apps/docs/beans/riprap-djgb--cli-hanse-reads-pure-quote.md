---
# riprap-djgb
title: CLI hanse reads + pure quote
status: todo
type: task
tags:
    - ts
    - cli
    - tdd
created_at: 2026-09-01T23:29:35Z
updated_at: 2026-09-01T23:29:35Z
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

Checklist:
- [ ] 4 commands + tests green; quote matches §8 to the base unit
