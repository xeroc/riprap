---
# riprap-izow
title: CLI hanse lifecycle commands
status: completed
type: task
tags:
    - ts
    - cli
    - tdd
created_at: 2026-09-01T23:29:35Z
updated_at: 2026-09-15T11:30:00Z
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
- [x] 8 commands + tests green
- [x] claim-payout two-signer path proven

## Summary of Changes

- `apps/cli/src/commands/hanse/` — 8 commands (one file per instruction): initialize, join, file-claim, settle-claim, settle-pool, claim-payout, dissolve, set-subaccord-param, all thin wrappers over `@riprap/hanse` + `@useaccord/sdk` PDA/fetch helpers. file-claim derives + prints `min_jury_size × fee_per_juror` before send; settle-pool prints the frozen ratio + pull_close_at post-send; claim-payout is the two-signer exception (claimant = wallet, `--co-signer` defaults to the wallet for self-demo, production = admin key); set-subaccord-param mirrors useaccord propose-update incl. executeAfterSlot readback. join/dissolve/settle-pool take `--pool`/`--deposit-mint` overrides for offline `--dry-run` (pool `--mint` precedent); set-subaccord-param takes `--subaccord`.
- `apps/cli/src/lib/hanse-args.ts` — pure parsing/fee math (tier spec `contribution:max-payout`, tier name→index, hex64, the 7 exposed `Kind:value` payloads, `juryFee` u64-checked).
- `packages/hanse/src/pdas.ts` — `subaccordDomainRef` (`H("hanse:subaccord" ‖ seed_le ‖ policy_hash)`, initialize_mutual.rs) + `findMutualSubaccordPda` (PDA `[subaccord, creator=initializer wallet, domain_ref]` under the accord program — the CPI creator is the initializer, not the mutual PDA); `@noble/hashes` dep.
- deps: `apps/cli` += `@riprap/hanse` (workspace, bundled by tsup) + `@useaccord/sdk@0.1.0` (npm, per milestone); `pool-args.toBigInt` widened to u16 for AlphaBps.
- tests: 87 CLI tests green — hanse.args (tier/payload/hex/fee), hanse.commands (subprocess dry-run snapshots w/ decoded args + PDA-bound accounts, 8-command help, clean offline errors), hanse.build (offline assembly: fee 3×5=15 USDC per §12, claim/dispute keyed by claim_nonce, claim-payout signed tx carries exactly 2 signatures: claimant + authority).
- `pnpm verify` green (build, biome, vitest, anchor build, cargo test).
