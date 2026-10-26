---
"@riprap/pool": patch
"@riprap/cranker": patch
---

Two findings from the 2026-10-24 security re-audit fixed in the pool program (spec amendment 2026-10-26). M-1 — burn is now scoped to the burning track: the money side drops by `min(amount, stake_track / rate)` (rates are immutable, so the division is exact), a burn on a closed (rate 0) track reverts with the new `BurnTrackClosed` error, a burn on an unfunded track is an exact no-op, and the saturate-at-every-balance semantics are retired — no track's authority can destroy residual weight funded on another track. M-2 — the crank's zero-weight terminal: `pool.total_amount == 0` (every depositor burned out) now pays 0 and marks the depositor settled instead of reverting forever, with a local depositor≤pool bound guard before the cast; leftover treasury in that state is the accepted dust class. The cranker's Dissolved sweep now includes zero-weight depositors (settled-only skip). Hanse behavior is unchanged (rate-1 rights track: the clamp lands on the same number).
