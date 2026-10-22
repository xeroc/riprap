---
"@riprap/cranker": patch
---

Reconciler decision-matrix cleanup for the retired pilot gate: the mutual fixture's dead `authority` override is gone (the encoder pins the field directly) and the reconciler's header state-machine sketch states the permissionless payout crank — a non-authority daemon emits `claim_payout` for settled mutuals inside the pull window.
