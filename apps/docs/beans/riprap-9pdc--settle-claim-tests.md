---
# riprap-9pdc
title: settle_claim + tests
status: completed
type: task
tags:
    - rust
    - tdd
created_at: 2026-09-01T17:39:11Z
updated_at: 2026-09-02T05:00:00Z
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
- [x] red then green across all three rulings

## Summary of Changes

- `instructions/settle_claim.rs`: permissionless crank; Dispute read directly (`Account<Dispute>` + `dispute.key == claim.dispute`, canon settle_item — no get_ruling CPI). Final+0 → Approved (obligations += claim_amount, fee_refunds += fee_paid, both checked); Final+1 → Denied (fee stays with jurors); Failed → fee refund float → claimant ATA signed by the mutual PDA (seeds from persisted `mutual.seed`); any non-terminal state → DisputeNotFinal; ruling outside {0,1} → UnexpectedRuling (defensive). Pending-only gate (idempotence); claims_resolved += 1, has_pending = false, settled_at = now; ClaimSettled emitted. No pool funds move except the Failed refund.
- Divergence check (bean asked): NONE — accord's cancel_dispute refunds fee_vault → filer_token_account (our float) at Failed, so forwarding float → claimant at settle is exactly right; documented on the float field.
- Tests: approve accounting (obligations/fee_refunds/resolved/settled_at/has_pending, treasury untouched), deny (nothing moves), failed refund lands on claimant (float pre-funded to simulate accord's refund), double settle (ClaimNotPending), wrong dispute (a REAL accord-owned planted dispute — the Account type fires AccountNotInitialized first for nonexistent accounts), non-terminal (freshly filed Created). 6/6; clippy 0; pnpm verify 0.
