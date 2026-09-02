---
# riprap-6ph7
title: Amend EVENT-MUTUAL.md (own docs commit)
status: completed
type: task
tags:
    - docs
created_at: 2026-09-01T17:40:03Z
updated_at: 2026-09-02T14:05:00Z
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
- [x] amendments staged as a docs-only change

## Summary of Changes

- `meta/specs/EVENT-MUTUAL.md` amended per the 2026-09-01 implementation grill (docs-only; the spec lives in the shared untracked `meta/` tree — no code file touched):
  - **Header ledger:** amendment note dated 2026-09-01 appended (built pool surface, burn rename, SAS deferral, hanse naming, claim_nonce/has_pending, Dispute-account rulings, pilot juror gate).
  - **§2.4/§5:** `pool::burn(track, amount)` on the built Track model — moves no tokens, drops `depositor.total_amount` + `pool.total_amount` by the same `min(amount, balance)`, stake by `min(amount × rate, stake)`; saturating everywhere (grill Q1). `burn_stake`/`StakeClass` sketch wording replaced throughout (§1 diagram, §2.1, §2.9, §3, §7).
  - **§2.5:** residual mechanics = burn at payout, then permissionless money-weighted `pool.crank` (`floor(total × liquidation_balance / pool.total_amount)`, once per depositor); rate-1 equivalence to stake-weighted-after-burn documented with the §8 numbers ($19,920 denominator, $11,940 residual → $11.98 each).
  - **§2.8:** SAS deferred to v2, bean `riprap-7wa9` referenced; stake-only Subaccord in v1; `Member.attestation` reserved as `Pubkey::default` (no space migration). §1/§7 join + create_subaccord wording updated to match.
  - **§2.10:** program/crate/SDK named `hanse` (`programs/hanse`, crate `hanse`, `@riprap/hanse`); domain words stay mutual; all five PDAs listed unchanged; "names no program" posture amended to "names the code, never the public surface".
  - **§4/§5:** account + instruction sketches replaced with the built surface — `init`/`deposit`/`spend`/`burn`/`liquidate`/`crank`/`update_authority`, flat per-track `rate`/`authority` fields, u128 stakes/totals, `liquidation_balance` freeze, `settled` flag; `stake = amount × rate` semantics; authority-gates-actions vs open-deposit semantics documented.
  - **§6/§7:** `claim_nonce: u64` on Mutual, `has_pending: bool` on Member (set at filing, cleared at settlement, gating `file_claim`); `settle_claim(claim, dispute)` reads the Dispute account directly — no `get_ruling` CPI; `initialize_mutual` CPIs rewritten to `pool::init` wiring; `claim_payout` uses `pool::burn(Rights, payout)`; residual exit via `pool::crank`.
  - **§12:** pilot row "Juror gate — stake-only in v1, SAS deferred to v2 (bean `riprap-7wa9`)".
- Verified: `pnpm lint` green (0 errors, 11 pre-existing warnings in untouched TS); `jj diff` docs-only (this bean file; spec is in the shared tree); stale-term sweep clean (no `burn_stake`/`StakeClass`/`initialize_pool`/`pool::withdraw` outside deliberate historical references). Gate lineage: dependency x469 ran `pnpm verify` exit 0 against these same §2.4/§8 numbers.
