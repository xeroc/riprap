---
# riprap-6ph7
title: Amend EVENT-MUTUAL.md (own docs commit)
status: todo
type: task
tags:
    - docs
created_at: 2026-09-01T17:40:03Z
updated_at: 2026-09-01T17:40:03Z
parent: riprap-6vc7
blocked_by:
    - riprap-x469
---

meta/specs/EVENT-MUTUAL.md amendments per the 2026-09-01 grill — docs-only commit, no code:
- §2.4/§5: burn is pool::burn(track, amount) on the BUILT Track model (rates, money-weighted totals), saturating; replace the burn_stake/StakeClass sketch wording.
- §2.5: residual mechanics = burn then money-weighted crank; document the rate-1 equivalence to stake-weighted-after-burn with the §8 numbers.
- §2.8: SAS deferred — stake-only subaccord in v1; reference bean riprap-7wa9; Member.attestation reserved.
- §2.10: program/crate/SDK named hanse; domain words stay mutual; PDAs unchanged.
- §4/§5: replace the idealized pool account sketch with the built surface (init/deposit/spend/liquidate/crank/update_authority/burn) incl. stake = amount x rate semantics.
- §6: claim_nonce on Mutual + has_pending on Member.
- §12: pilot row noting the stake-only juror gate for v1.
Append an amendment note dated 2026-09-01 in the header ledger.

Checklist:
- [ ] amendments staged as a docs-only change
