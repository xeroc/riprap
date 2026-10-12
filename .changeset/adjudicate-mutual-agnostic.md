---
"@riprap/landing": minor
---

Adjudication surface is mutual-agnostic. The `#/app/adjudicate` duty board now serves every pool the wallet joined (the /app mutuals store scan — one serve panel + seat list per pool) instead of one static-mapped mutual; the retired `#/app/adjudicate/:pool` route form falls to the board. The voting session (`#/app/adjudicate/:dispute/:round`) resolves its pool from the dispute's subaccord matched against the live mutuals, and its policy questions come from the pool's directory entry: a new `adjudicationPolicy` field on the `mutuals/data.ts` listing resolves through the keyed registry in `adjudicate/policies/index.ts` — the claim wizard's `claimFlow` pattern. Both Blade Pool listings pin `blade-pool`; a pool without a pack gets an honest no-policy session state. The unused single-mutual `JuryDutyPanel` is deleted.
