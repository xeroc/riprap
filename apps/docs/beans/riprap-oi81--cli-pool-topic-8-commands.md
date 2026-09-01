---
# riprap-oi81
title: CLI pool topic (8 commands)
status: todo
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
- [ ] 8 commands + tests green
- [ ] help output shows pool topic complete
