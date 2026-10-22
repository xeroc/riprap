---
# riprap-lqvz
title: renew (forward-only) + advance_epoch (idempotent boundary)
status: todo
type: task
tags:
    - rust
created_at: 2026-10-21T10:41:42Z
updated_at: 2026-10-21T10:41:42Z
parent: riprap-h292
---

renew: re-verify credential, cover_until = max(now, cover_until) + epoch_len — never retroactive. advance_epoch: epoch_index++, recompute budget, snapshot exit base; second call same boundary = no-op.
