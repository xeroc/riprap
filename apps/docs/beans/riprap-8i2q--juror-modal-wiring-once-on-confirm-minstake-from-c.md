---
# riprap-8i2q
title: Juror modal wiring — once on confirm, minStake from chain
status: todo
type: task
created_at: 2026-09-17T14:05:49Z
updated_at: 2026-09-17T14:05:49Z
parent: riprap-wan9
blocked_by:
    - riprap-kctm
    - riprap-sbkp
    - riprap-v78i
---

On join-confirmed signature: JurorUpsellDialog (A3) opens with mutual.min_stake, copy verbatim from doc (D2), OK closes; no persistence machinery (one join per mutual); reload → alreadyMember → stamp, no modal.
