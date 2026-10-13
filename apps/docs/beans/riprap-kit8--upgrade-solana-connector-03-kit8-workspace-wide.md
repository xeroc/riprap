# riprap-kit8
title: Upgrade @solana/connector to 0.3.x — workspace-wide @solana/kit 8 migration
status: open
type: task
priority: high
created_at: 2026-10-13T18:05:00Z
updated_at: 2026-10-13T18:05:00Z
parent:
---

@solana/connector 0.3.0 (published 2026-09-30) moves its internals to `@solana/kit ^8.2` + `@solana/react ^8.2` + `@wallet-standard/ui`, while the entire riprap workspace sits on `@solana/kit ^7` (`apps/landing`, `apps/cli`, `apps/cranker`, `tests`, and the generated `@riprap/pool` + `@riprap/hanse` Codama clients). Bumping the connector alone (verified 2026-10-13): builds and all mocked tests stay green, but `pnpm peers check` fails (`@solana/react@8.4.0` wants kit ^8; `@wallet-ui/core@4.3.0` wants kit 6||7), and the landing bundle ships two kit majors — the live wallet-signing path (kit-7 `sendInstruction` consuming connector kit-8 signers) has zero CI coverage because every suite mocks it. Deferred: reverted to `^0.2.6` (MWA works there — mobile enabled in providers.tsx regardless).

## Scope of the real upgrade

- `@solana/kit` ^7 → ^8 across every workspace package + the jest e2e harness.
- Regenerate `@riprap/pool` + `@riprap/hanse` Codama clients against kit 8 (codegen, fetch facades, memcmp offsets re-asserted).
- Check `@useaccord/sdk@0.2.0` kit compat — may need an accord-side bump or pin work (cross-repo, see the accord pin row in AGENTS.md).
- Re-run `pnpm verify` + a live `anchor test` + one real device/wallet signing pass (MWA) before closing.

Open question: does anything in the 0.3.x line actually pay for itself (wallet-ui elements, kit plugins), or do we ride 0.2.x until a needed feature forces the jump?
