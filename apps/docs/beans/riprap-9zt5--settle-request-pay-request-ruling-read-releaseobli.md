---
# riprap-9zt5
title: settle_request + pay_request — ruling read, release/obligation, off-the-top take, FIFO queue
status: todo
type: task
tags:
    - rust
created_at: 2026-10-21T10:41:42Z
updated_at: 2026-10-21T10:41:42Z
parent: riprap-8n5v
---

Denied/Failed → reserve + fee refund released. Approved → obligation; pay_request permissionless (ADR-0005 pattern): pay min(obligation, budget_remaining), take split claimant/operator/protocol, remainder re-queues tail. Payment-time take rate.
