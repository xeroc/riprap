---
# riprap-izow
title: CLI hanse lifecycle commands
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
    - riprap-vrzq
---

src/commands/hanse/* over @riprap/hanse (initialize/join/file-claim/settle-claim/settle-pool/claim-payout/dissolve/set-subaccord-param):
- hanse:initialize: full mutual config — --seed, tiers as --tier contribution:max-payout (exactly 3, order = Basic/Standard/Premium), --policy-hash <hex64>, --deposits-close-at/--claims-close-at (unix seconds) + --pull-window (seconds), subaccord params mirroring useaccord lifecycle:create-subaccord flags. Output: mutual, pool, subaccord, float ATA addresses. Note for the pilot: EVENT-MUTUAL §12 is the frozen arg set.
- hanse:join --mutual --tier basic|standard|premium (index mapping documented).
- hanse:file-claim --mutual --amount --evidence <hex64>: SDK clamp applies (tier cap); fee auto-derived (min_jury_size x fee_per_juror from the subaccord) and PRINTED before send; claim ATA funding is the member fee ATA (same wallet).
- hanse:settle-claim --claim (permissionless).
- hanse:settle-pool --mutual (permissionless; prints frozen ratio + pull_close_at).
- hanse:claim-payout --claim [--co-signer <keypair path>]: THE multi-signer exception — claimant signs, Mutual.authority co-signs the pass gate (spec §2.10). Default --co-signer = the loaded wallet (self-demo); document that production uses the admin key.
- hanse:dissolve --mutual (permissionless).
- hanse:set-subaccord-param --mutual --payload Kind:value (authority-gated propose; mirror useaccord lifecycle:propose-update incl. executeAfterSlot readback).
Tests: dry-run snapshots, tier flag parsing/validation, fee derivation math, co-signer signer-set assembly (two signers present in the built tx).

Checklist:
- [ ] 8 commands + tests green
- [ ] claim-payout two-signer path proven
