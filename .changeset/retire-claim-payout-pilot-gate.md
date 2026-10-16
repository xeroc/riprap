---
"@riprap/hanse": patch
---

Retire the `claim_payout` pilot authority gate (ADR-0005 amendment): the one account constraint is commented out and any key may crank — the payout still lands only in the claimant's canonical ATA. The cranker's mirrored authority skip, the spec §7/§12 wording, and every test asserting the old rejection moved in the same change.
