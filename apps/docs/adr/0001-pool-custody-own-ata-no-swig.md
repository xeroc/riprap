---
status: accepted
---

# 0001 — Pool custody is a pool-owned token account, not swig

`meta/Pool Program.md` and `meta/PROJECT.md` specify the pool treasury as a swig smart wallet with spending configured via swig's `TokenDestinationLimit` policy. For v1 we deliberately deviate: the pool PDA owns a plain associated token account, and both exit doors (spending, liquidation) are instructions of the pool program itself. Reason: a working localnet demo ASAP — swig adds an external program dependency, an unfamiliar Rust SDK, and a CPI surface to every outbound transfer, none of which the pool primitive needs to prove its accounting. Deposits were never swig-gated anyway (an SPL transfer into the treasury is just a transfer).

## Considered options

- **Swig created off-chain, pool records the address** — closest to spec, still one swig CPI path (outbound) and an external deployment dependency for every test run.
- **Swig created by pool init** — most self-contained on-chain, doubles the swig coupling.
- **Pool-owned ATA (chosen)** — zero external programs; both doors enforced in one program where the two-door law is actually testable.

## Consequences & migration

- The spending door is a rights-authority-signed `spend(amount, destination)` push transfer instead of a policy-driven pull from the swig treasury. Payouts are push, not pull.
- Moving to swig later is a custody migration: create swig with owner = pool PDA, drain the ATA into it, record the swig treasury in pool state, and swap the two outbound instructions' transfer paths for swig CPI. The instruction surface, accounting, and money-weighted crank are unaffected — which is why this deviation is safe to make now.
- This ADR + `CONTEXT.md` (Treasury) are the record; the meta docs still describe the end-state and are not edited as part of code work.
