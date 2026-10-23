---
"@riprap/cli": patch
---

`riprap hanse:show` now dumps every decoded field of the Mutual account in its human output, in account-layout order: authority, pool + subaccord links, the SAS juror credential/schema, mints, the policy hash as hex, the three tiers, the deposits/claims windows + fixed pull window, seed, phase, the frozen settlement ratio, obligations + fee refunds, claim counters + nonce, bump, and reserved padding — joining the previously shown subset, plus the derived treasury ATA and live balance. Active mutuals now render `— (not settled)` for the pull close instead of the 1970 epoch date. The `--json` output already carried every field and is unchanged.
