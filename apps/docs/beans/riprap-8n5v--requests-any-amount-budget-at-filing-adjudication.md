---
# riprap-8n5v
title: 'Requests: any amount, budget at filing, adjudication, queue, take'
status: todo
type: epic
priority: normal
tags:
    - rust
created_at: 2026-10-21T10:41:42Z
updated_at: 2026-10-21T10:41:42Z
parent: riprap-6684
blocked_by:
    - riprap-h292
---

file_request (reserve = min(requested, budget_remaining), fees, dispute CPI), settle_request (release on deny), pay_request (permissionless, off-the-top take, FIFO queue), set_take_bps ratchet. Spec §4/§5/§8, ADR-0010. Depends on membership epic.
