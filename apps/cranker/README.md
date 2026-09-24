# @riprap/cranker — `riprap-cranker`

Lifecycle daemon for the permissionless cranks: watches every Mutual (or a configured subset) and advances each through its on-chain gates — EVENT-MUTUAL §7 order. Architecture ported from the sibling `@useaccord/cranker` (`../accord/apps/cranker`): dispatch registry + reconciler poll + one module per crank + retry/escalate send path.

```
Active   → settle_claim × N   (Pending claims whose accord Dispute is Final/Failed)
          settle_pool         (claims_close_at passed AND filed == resolved)
Settled  → claim_payout × N   (Approved claims, inside the pull window)
                               PILOT GATE: only when the cranker key IS the
                               mutual's authority (ADR-0005); skipped otherwise
          dissolve            (pull_close_at passed)
Dissolved→ pool_crank × N     (unsettled depositors with total > 0 — the residual)
```

Every crank is permissionless on-chain; the cranker pays fees and gains nothing. Failures are per-action: a reverted crank logs and the next cycle (60s default) re-resolves from chain truth — racing another cranker is harmless.

## Running

```bash
cp .env.example .env    # set RIPRAP_CRANKER_KEYPAIR (pilot: the operator/authority key)
pnpm --filter @riprap/cranker dev          # bun --watch
RIPRAP_CRANKER_ONCE=1 pnpm --filter @riprap/cranker start   # single cycle (cron/CI)
```

| Env | Default | Notes |
|---|---|---|
| `RIPRAP_RPC_URL` | `http://127.0.0.1:8899` | Solana JSON-RPC endpoint |
| `RIPRAP_WS_URL` | ws counterpart of `--rpc` | WebSocket endpoint for send+confirm |
| `RIPRAP_CRANKER_KEYPAIR` | — (required) | Cranker fee-payer keypair; must be ≥ 0.1 SOL funded (boot check) |
| `RIPRAP_CRANKER_INTERVAL_MS` | `60000` | Poll interval — gates tick in hours/days |
| `RIPRAP_CRANKER_MUTUALS` | all Mutuals | Comma-separated mutual addresses to restrict discovery |
| `RIPRAP_CRANKER_ONCE` | off | `1` = single cycle then exit |

## Layout

- `src/reconciler.ts` — the lifecycle state machine + poll loop (`reconcileOnce` / `startReconciler`)
- `src/dispatch.ts` — the crank registry; reconciler never imports a crank directly
- `src/cranks/hanse/{settle-claim,settle-pool,claim-payout,dissolve}.ts`, `src/cranks/pool/crank.ts` — one module per crank (account assembly mirrors the `riprap` CLI commands)
- `src/send.ts` — one ix per tx, priority-fee escalation on retry, `SimulationError` never retried
- `src/wallet.ts` — keypair load + funded-at-boot check
- Discovery reads ride the SDK scans: `fetchAllMutuals` / `fetchClaimsOfMutual` (`@riprap/hanse`), `fetchDepositorsOfPool` (`@riprap/pool`) — no hand-rolled getProgramAccounts plumbing here.

## Tests

`pnpm --filter @riprap/cranker test` — vitest. The reconciler matrix runs the real SDK scan helpers against a fake rpc with honest memcmp semantics; the accord Dispute read is module-mocked (its fixture surface outweighs the one `state` field consumed).

## Not ported from the accord cranker

The WebSocket account listener (latency shim) — riprap's gates tick in hours and days; the 60s poll is the latency story. Tree-cache, canon-gc, synod modules are accord-domain.
