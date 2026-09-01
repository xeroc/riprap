---
# riprap-ctt6
title: CLI base command layer + config topic
status: todo
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
- [ ] lib ported + unit tests green
- [ ] config:show / config:balance working incl. --json/--quiet
