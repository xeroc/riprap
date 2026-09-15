---
# riprap-ctt6
title: CLI base command layer + config topic
status: completed
type: task
tags:
    - ts
    - cli
    - tdd
created_at: 2026-09-01T23:29:10Z
updated_at: 2026-09-01T23:29:10Z
parent: riprap-pobu
blocked_by:
    - riprap-cxp8
---

Port @useaccord/cli src/lib to riprap conventions (Biome formatting, vitest):
- base-command.ts: BaseCommand (output flags --json/--quiet, parse in init) and ChainCommand (chain flags --keypair/-k, --rpc/-r, --ws/-w, --commitment, --dry-run; resolves ChainContext: rpc + subscriptions, KeyPairSigner, sendAndConfirm factory; renderSend/renderCreated/renderRead output modes; toCliError mapping).
- wallet.ts: keypair resolution flag -> RIPRAP_KEYPAIR_PATH -> ANCHOR_WALLET -> ~/.config/solana/id.json; rpc -> RIPRAP_RPC_URL -> http://127.0.0.1:8899; ws derived or RIPRAP_WS_URL.
- errors.ts, output.ts, format.ts (port + trim to what config/pool/hanse need).
- commands: config:show (resolved config, payer balance, pool + hanse program ids), config:balance [--address] [--token-mint].
- Single-signer model default: wallet = fee payer + instruction signer (accord CLI.md rule); hanse:claim-payout is the one documented multi-signer exception (its own bean).
- Tests: wallet resolution matrix, output render modes, config:show against a mock env (accord test/lib pattern, vitest).

Checklist:
- [x] lib ported + unit tests green
- [x] config:show / config:balance working incl. --json/--quiet

## Summary of Changes

- Ported the @useaccord/cli lib layer to riprap conventions: `src/lib/base-command.ts` (BaseCommand with --json/--quiet + emitters + structured catch; ChainCommand with chain flags, loadChain → ChainContext {rpc, rpcSubscriptions, sendAndConfirm, signer, ws, commitment}, sendInstruction v0 flow, emitDryRun), `wallet.ts` (flag → $RIPRAP_KEYPAIR_PATH → $ANCHOR_WALLET → ~/.config/solana/id.json; ws derivation 8899→8900), `errors.ts` (pool error code index from @riprap/pool + RpcUnreachable hint; hanse codes join later), `output.ts`, `format.ts`, `token.ts` (ATA derivation for config:balance --token-mint), `keypair-file.ts` (test fixture — kit v7 validates seed‖pubkey consistency).
- Commands: `config:show` (resolved rpc/ws/keypair/authority, pool program id, hanse `null`/not-installed until @riprap/hanse lands, payer SOL balance) and `config:balance [ADDRESS] [--token-mint]` (SOL via getBalance, SPL via derived ATA + getTokenAccountBalance).
- Tests (32, all green): format/output render modes, toCliError mapping, wallet resolution matrix + loadKeypair error paths, and command-level tests driving `bun bin/dev.js` (help surface, unreachable-RPC → RpcUnreachable in human + --json modes) per the accord mock-env pattern.
- typescript pinned ^5.9.0: oclif dev-mode's tsconfig remap needs the JS TypeScript API (`parseConfigFileTextToJson`), which typescript@7 (Go build) dropped; ts-node in bin/dev.js needs it too. Other workspace packages keep their pins.
- @riprap/pool declared in devDependencies: tsup auto-externalizes `dependencies`, and the SDK ships raw .ts source — inlining it (accord pattern) is what makes `node bin/run.js` work from dist.
- tsup walk now excludes `*.test.ts` (colocated tests are repo convention; they would otherwise bundle as bogus commands).
- errors.ts RpcUnreachable regex extended with bun's `unable to connect` fetch wording (config tests spawn bun).
- `pnpm verify` green end-to-end; biome zero errors (remaining warnings pre-exist in generated/ui code).
