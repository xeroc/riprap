---
# riprap-42cw
title: file_request — any amount, reserve at filing, credential valid at filing
status: todo
type: task
tags:
    - rust
created_at: 2026-10-21T10:41:42Z
updated_at: 2026-10-21T10:41:42Z
parent: riprap-8n5v
---

Requested u64 unclamped by any per-request cap; reserve = min(requested, budget_remaining); budget decremented by reserve; juror fees prepaid; Accord create_dispute CPI (filer = circle PDA).
