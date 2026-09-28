---
"@riprap/landing": patch
---

Renames the juror/filing fee to the adjudication fee across member-facing copy (pool page stamp and FAQ now carry the policy's 200 USDC with forfeit-on-denial / return-on-failed semantics), corrects sponsor copy — a sponsored membership's claim payments go to the member, the unused remainder to whoever paid the entry fee — and fixes the claim wizard's preflight and review to charge the on-chain filing cost `(min_jury_size + 1) × fee_per_juror` (the +1 unit is the filer's flip-bounty deposit, ADR-0030), so the balance gate no longer under-checks by one fee unit.
