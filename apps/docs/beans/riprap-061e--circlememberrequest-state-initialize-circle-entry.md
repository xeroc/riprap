---
# riprap-061e
title: Circle/Member/Request state + initialize_circle (entry credential pinned, epoch_len 1d–365d validated)
status: todo
type: task
priority: normal
tags:
    - rust
created_at: 2026-10-21T10:41:41Z
updated_at: 2026-10-21T10:41:41Z
parent: riprap-rgag
blocked_by:
    - riprap-6z97
---

State per spec §3 (no ExitIntent account — field on Member), initialize_circle per §4: pool creation with circle PDAs as authorities, subaccord, juror credential mint, external entry credential + schema pinned immutable, budget/contribution/take_bps init. Space tests pin layout (hanse state.rs test pattern).
