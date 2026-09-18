# @riprap/cli — `riprap`

Operator CLI for the Riprap pool + hanse programs: a thin wrapper over `@riprap/pool`, `@riprap/hanse`, and `@useaccord/sdk` (accord PDAs/reads). No protocol logic lives here — every command builds an SDK instruction, prints what it derived, and sends it.

## Running

```bash
pnpm install

# Development (TypeScript sources, bun):
pnpm --filter @riprap/cli dev hanse:show --mutual 9xQe…

# Built distribution (node, what bin/riprap ships):
pnpm --filter @riprap/cli build
node apps/cli/bin/run.js hanse:show --mutual 9xQe…
```

Development entry: `bin/dev.js` loads `.ts` sources directly (`oclif development: true`). Production entry: `bin/run.js` loads compiled `dist/commands` — build first.

## Configuration

| Flag | Env | Default | Notes |
|---|---|---|---|
| `--rpc, -r` | `RIPRAP_RPC_URL` | `http://127.0.0.1:8899` | Solana JSON-RPC endpoint |
| `--ws, -w` | `RIPRAP_WS_URL` | ws counterpart of `--rpc` (http→ws, :8899→:8900) | WebSocket endpoint for send+confirm |
| `--keypair, -k` | `RIPRAP_KEYPAIR_PATH` → `ANCHOR_WALLET` → `~/.config/solana/id.json` | — | Solana keypair JSON (64 uint8 array) |
| `--commitment` | — | `confirmed` | `processed` \| `confirmed` \| `finalized` |
| `--dry-run` | — | off | Build + print the instruction (accounts, data hex); never sign/send |
| `--json` | — | off | One JSON value on stdout (bigints as decimal strings); errors as `{ error, message, hint? }` on stderr |
| `--quiet, -q` | — | off | Only the signature (send) or address (create/read) |

Every chain-touching command takes all of the above (`chainFlags`); `hanse:quote` is pure — only `--json`/`--quiet`.

## Commands

```
config:  balance, show
pool:    init, deposit, spend, burn, liquidate, crank, update-authority, show, depositor
hanse:   initialize, join, file-claim, settle-claim, settle-pool, claim-payout,
         dissolve, set-subaccord-param, show, claim, member, quote
```

- **config** — cluster/wallet introspection shared by both topics.
- **pool** — the three-track mutual-pool primitive (`@riprap/pool`).
- **hanse** — the event-mutual orchestrator (`@riprap/hanse`); `hanse:quote` is the offline §8 payout calculator.

`hanse:initialize` constraints (security review 2026-09-18): `--deposit-mint` must equal `--fee-mint` (the program rejects mixed mints), and there is no `--pull-window` flag — the payout window is fixed on-chain at 180 days.

Per-command docs: `riprap <topic>:<command> --help`.

### Offline `--dry-run`

Commands that only need PDA math run dry with no RPC (`hanse:initialize` always; `hanse:join`/`hanse:settle-pool`/`hanse:dissolve` with `--pool` + `--deposit-mint`; `hanse:set-subaccord-param` with `--subaccord`). Commands whose inputs ARE chain state — `hanse:file-claim` (claim nonce + live jury economics), `hanse:settle-claim`, `hanse:claim-payout` — need RPC even for `--dry-run`.

## Signer model

Single-signer: the loaded keypair is fee payer AND the instruction signer. The one exception is `hanse:claim-payout` (spec EVENT-MUTUAL §2.10): the claimant signs and the mutual's authority co-signs the event-pass gate — pass the admin key via `--co-signer <path>`. The default (`--co-signer` omitted) is the loaded wallet itself, for self-demo setups only.

## Development

```bash
pnpm --filter @riprap/cli lint      # biome
pnpm --filter @riprap/cli test      # vitest (dry-run snapshots, pure math, structural rpc fixtures)
pnpm --filter @riprap cli build     # tsc --noEmit + tsup
```

`src/suite.test.ts` enforces help completeness (every command loads, carries `summary` + `examples`, renders help with zero oclif scan noise). `src/surfpool-smoke.test.ts` runs one live `pool:init → deposit → spend --dry-run` chain through the CLI when a local validator is reachable (`RIPRAP_SMOKE_RPC`, default `http://127.0.0.1:8899`), and skips cleanly otherwise.
