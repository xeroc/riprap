---
# riprap-kctm
title: Chip-in state machine + balance pre-checks + toasts
status: todo
type: task
priority: high
created_at: 2026-09-17T14:05:49Z
updated_at: 2026-09-17T14:05:49Z
parent: riprap-wan9
blocked_by:
    - riprap-lqb0
    - riprap-da99
    - riprap-gced
---

idle→building→wallet-signing→confirming→covered per HANDOFF §4: render from getJoinContext; click → buildJoinInstructions → sendInstruction; deposit+SOL pre-check disable with inline reason (+Circle faucet link on devnet, 4zMM…); alreadyMember → Covered—{tier} stamp, slider locked, /app link; errors → describeError toast, back to idle. Copy from doc (D2).
