---
# riprap-82ro
title: pool::exit_depositor — ratio-neutral per-depositor exit, ownership-authority gated (POST-PILOT)
status: todo
type: task
tags:
    - rust
    - pool
created_at: 2026-10-21T10:41:42Z
updated_at: 2026-10-21T10:41:42Z
parent: riprap-r0zp
---

The ONLY pool change in this milestone; ships after Breakpoint 2026. Atomic: pay total/total_amount × treasury, decrement both. Codegen + all consumers (CLI/cranker/tests/landing reads) in same change per repo map.
