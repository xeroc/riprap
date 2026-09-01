---
# riprap-c448
title: 'e2e spec e: lifecycle gates and idempotence'
status: todo
type: task
tags:
    - ts
    - e2e
created_at: 2026-09-01T17:40:03Z
updated_at: 2026-09-01T17:40:03Z
parent: riprap-oaa8
blocked_by:
    - riprap-0zvk
---

Gate matrix against the live mutual:
- join after deposits_close_at reverts (warp)
- file_claim after claims_close_at reverts
- claim_payout WITHOUT authority co-sign reverts
- claim_payout after pull_close_at reverts (unpulled amount reverts to residual)
- double claim_payout reverts (status Paid)
- settle_pool with a pending claim reverts
- dissolve before pull_close_at reverts
Finish with the full @riprap/tests suite green serially on one Surfpool (global clock caveat respected).

Checklist:
- [ ] spec green
- [ ] whole suite green in one anchor test run
