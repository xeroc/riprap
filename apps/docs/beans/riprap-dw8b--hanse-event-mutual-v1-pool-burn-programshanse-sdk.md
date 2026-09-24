---
# riprap-dw8b
title: 'Hanse event mutual v1: pool burn + programs/hanse + SDK + Surfpool e2e'
status: completed
type: milestone
priority: normal
created_at: 2026-09-01T17:38:24Z
updated_at: 2026-09-24T06:59:39Z
---

Hanse event mutual v1: pool::burn + programs/hanse + @riprap/hanse SDK + Surfpool e2e. Implements meta/specs/EVENT-MUTUAL.md as amended by the 2026-09-01 implementation grill.

Locked decisions:
- Program/crate/SDK named hanse; domain words stay mutual (Mutual account, PDA seeds [mutual, seed], [mutual_auth, mutual], [mutual_own, mutual], [member, mutual, member], [claim, mutual, nonce]).
- pool gains one instruction: burn (track-authority gated) so paid claimants exit the residual; the money-weighted crank then reproduces spec §8 exactly.
- accord crate: git dep ssh://git@github.com/xeroc/accord.git rev ba91bd8b8b374091c174909b115688ffb9b231ff features cpi.
- No SAS in v1: subaccord ships stake-only (spec §2.8 degradation path); tracked by bean riprap-7wa9. Member.attestation kept as reserved Pubkey::default field to avoid a later account-space migration.
- e2e: jest port of the accord Surfpool harness; @useaccord/sdk@0.1.0 from npm drives juror-side accord flows; specs a-e (solvent to-the-cent, denied, over-treasury, appeal ladder, gates); Failed-refund e2e deferred, covered by LiteSVM unit.
- Rulings are read directly from the accord Dispute account (Account<Dispute>, canon settle_item pattern) — no get_ruling CPI.
- Completion gate: pnpm verify green; e2e skips cleanly with no validator reachable.

House law: TDD (red first), lint law (biome + cargo, zero errors), one file per instruction with handler_* impls, u128 checked intermediates, no unwrap on user paths, provenance comments citing spec sections.

CLI epic added later (2026-09-02): apps/cli (@riprap/cli, oclif v4) under riprap-pobu — config/pool/hanse topics over @riprap/pool + @riprap/hanse; also added riprap-0yfb (@riprap/pool SDK regen for burn).
