---
# riprap-oi81
title: CLI pool topic (8 commands)
status: completed
type: task
tags:
    - ts
    - cli
    - tdd
created_at: 2026-09-01T23:29:35Z
updated_at: 2026-09-01T23:29:35Z
parent: riprap-pobu
blocked_by:
    - riprap-ctt6
    - riprap-0yfb
---

src/commands/pool/* over @riprap/pool (post-regen, includes burn). One file per command, ChainCommand base, full flags + examples + summaries per the accord command style:
- pool:init --seed --mint --ownership-rate --rights-rate --yield-rate + the three authority flags (defaults match hanse wiring only when said out loud — no hidden defaults, all required or explicit).
- pool:deposit --pool --track ownership|rights|yield --amount (payer = depositor; sponsor rent via --rent-payer optional).
- pool:spend --pool --destination <ata> --amount (rights authority signs).
- pool:burn --pool --owner <depositor owner> --track --amount (track authority signs).
- pool:liquidate --pool (ownership authority).
- pool:crank --pool --owner (pays the owner share; cranker = payer, receives nothing).
- pool:update-authority --pool --track --new <pubkey> (current authority signs).
- pool:show --pool / pool:depositor --pool --owner (read-only: account dump, treasury balance, money-weighted share preview against live balances).
All chain commands honor --dry-run (build + print ix), --json, --quiet.
Tests: --dry-run instruction snapshots (accounts + args) per command, PDA derivations via SDK helpers, read commands against decoded fixtures (vitest; no validator dependency).

Checklist:
- [x] 8 commands + tests green
- [x] help output shows pool topic complete

## Summary of Changes

- `src/commands/pool/` — nine commands over @riprap/pool (post-burn regen), one file each on ChainCommand: `init` (seed/mint/three rates/three authorities, all required — no hidden defaults), `deposit` (wallet = depositor, optional `--rent-payer` second keypair), `spend`, `burn`, `liquidate`, `crank`, `update-authority`, `show`, `depositor`. All honor `--dry-run`/`--json`/`--quiet`.
- Treasury ATA derived per command via the CLI's ATA helper; commands that need the mint accept an optional `--mint` override to skip the pool-account fetch (documented as the offline `--dry-run` path) — `lib/pool-resolve.ts`.
- `lib/pool-args.ts` (u64/u128 integer parsing with named errors, track-name→enum mapping), `lib/pool-math.ts` (`moneyWeightedPayout` = floor(base × depositor ÷ pool total), exact port of crank.rs `payout()`).
- Read commands: `pool:show` (decoded account + live treasury balance + payout base), `pool:depositor` (position + frozen stakes + money-weighted payout preview; base = live balance while Open, frozen `liquidationBalance` after Liquidation, per crank constraint). View builders exported and tested against SDK-encoded fixtures through a structural rpc mock.
- Tests (54 total in @riprap/cli, +22 this bean): dry-run instruction snapshots per write command via `bun bin/dev.js` (program id, account order/roles asserted against SDK PDA helpers with a fixed-seed keypair, args decoded with the SDK data decoders); topic-help completeness; reads fixtures; math red-first.
- Verified: `pnpm verify` exit 0; biome zero errors (13 warnings all pre-existing in generated pool code + ui).
