---
# riprap-9pdc
title: settle_claim + tests
status: todo
type: task
tags:
    - rust
    - tdd
created_at: 2026-09-01T17:39:11Z
updated_at: 2026-09-01T17:39:11Z
parent: riprap-ggsd
blocked_by:
    - riprap-ihyo
---

EVENT-MUTUAL §7. Permissionless crank; moves no pool funds except the Failed refund.
Read the accord Dispute account DIRECTLY: Account<Dispute> (Anchor ownership check), constraint dispute.key() == claim.dispute — canon settle_item pattern, no get_ruling CPI.
- Final + final_ruling == approve index (0): status Approved, obligations += claim_amount, fee_refunds += fee_paid.
- final_ruling == deny index (1): status Denied; fee stays with jurors.
- Dispute Failed: status Failed; forward refund — float ATA -> claimant ATA transfer signed by mutual PDA, amount claim.fee_paid (Accord refunded the filer into the float; document any divergence found at build).
claims_resolved += 1; member.has_pending = false; claim.settled_at = now. Only from Pending — anything else reverts (idempotence).
Harness: fabricated terminal Dispute states (H2 helper).

Tests: approve accounting, deny path (no pool movement), failed refund lands on claimant, double settle reverts, wrong dispute account reverts, non-terminal dispute reverts.

Checklist:
- [ ] red then green across all three rulings
