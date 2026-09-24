/**
 * Reconciler — the authoritative poll loop (ported from @useaccord/cranker
 * src/reconciler.ts, rewritten for riprap's mutual lifecycle).
 *
 * One cycle scans every Mutual (or the configured subset) and emits the
 * crank actions its on-chain state allows, EVENT-MUTUAL §7 order:
 *
 *   Active   → settle_claim × (Pending claims whose Dispute is Final/Failed)
 *              settle_pool once claims_close_at passed AND filed == resolved
 *              (deferred a cycle when settle_claim ran — the counters move
 *              on-chain, the snapshot is stale)
 *   Settled  → claim_payout × Approved claims while now < pull_close_at —
 *              PILOT GATE (ADR-0005): only when the cranker holds
 *              mutual.authority; otherwise skipped with a reason
 *              dissolve once now >= pull_close_at
 *   Dissolved→ pool_crank × (unsettled positions with total > 0) once the
 *              pool is Liquidated — the residual exits
 *
 * The listener variant of the accord cranker (WebSocket latency shims) is
 * deliberately not ported: riprap's gates tick in hours and days, not
 * blocks; the 60s poll IS the latency story.
 */
import {
  ClaimStatus,
  fetchAllMutuals,
  fetchClaimsOfMutual,
  fetchMutual,
  Phase,
} from "@riprap/hanse";
import { fetchDepositorsOfPool, fetchPool, PoolState } from "@riprap/pool";
import type { Address, Instruction, Rpc, SolanaRpcApi, TransactionSigner } from "@solana/kit";
import { DisputeState, fetchMaybeDispute } from "@useaccord/sdk";

import type { CrankDispatch } from "./dispatch.js";
import { errorDigest } from "./send.js";
import type { CrankAction, CrankContext, MutualAccount } from "./types.js";

export interface ReconcilerConfig {
  rpc: Rpc<SolanaRpcApi>;
  signer: TransactionSigner;
  cranker: Address;
  dispatch: CrankDispatch;
  /** Send path bound by the caller (index.ts wires send.ts; tests stub it). */
  sendIx: (ix: Instruction) => Promise<string>;
  /** Restrict discovery to these mutuals; default: every Mutual account. */
  mutuals?: readonly Address[];
  /** Clock override for tests. Default: wall-clock unix seconds. */
  now?: () => bigint;
  log?: (msg: string, fields?: Record<string, unknown>) => void;
}

export interface ReconcilerHandle {
  /** Stop the poll timer. In-flight cycles finish. */
  stop(): void;
}

/**
 * Run one reconciliation cycle. Returns the number of actions a registered
 * handler actually executed (unhandled actions are logged + skipped).
 */
export async function reconcileOnce(config: ReconcilerConfig): Promise<number> {
  const log = config.log ?? (() => {});
  const ctx: CrankContext = {
    rpc: config.rpc,
    signer: config.signer,
    cranker: config.cranker,
    sendIx: config.sendIx,
    log: (kind, subject, msg) => log("crank", { kind, subject: subject ?? null, msg }),
  };

  let mutuals: MutualAccount[];
  try {
    mutuals = await discoverMutuals(config);
  } catch (e) {
    // RPC down / scan rejected — a cycle-level failure, not a per-mutual one.
    log("discovery failed", { error: errorDigest(e) });
    return 0;
  }

  let executed = 0;
  for (const mutual of mutuals) {
    try {
      executed += await reconcileMutual(ctx, config, mutual, mutualNow(config));
    } catch (e) {
      log("mutual cycle failed", { mutual: mutual.address, error: errorDigest(e) });
    }
  }
  return executed;
}

/**
 * Start the poll loop. Fires one cycle immediately (so the cranker does work
 * on boot), then every `intervalMs`. A failed cycle is logged but never
 * kills the timer — the next cycle retries.
 */
export function startReconciler(
  config: ReconcilerConfig & { intervalMs: number },
): ReconcilerHandle {
  const { intervalMs, ...once } = config;
  const timer = setInterval(() => {
    reconcileOnce(once).catch(() => {
      // cycle-level failure (e.g. RPC down) — already logged inside; keep polling
    });
  }, intervalMs);
  reconcileOnce(once).catch(() => {});
  return {
    stop() {
      clearInterval(timer);
    },
  };
}

async function discoverMutuals(config: ReconcilerConfig): Promise<MutualAccount[]> {
  if (config.mutuals !== undefined) {
    return await Promise.all(config.mutuals.map((address) => fetchMutual(config.rpc, address)));
  }
  return await fetchAllMutuals(config.rpc);
}

function mutualNow(config: ReconcilerConfig): bigint {
  return config.now?.() ?? BigInt(Math.floor(Date.now() / 1000));
}

/** One mutual's slice of the cycle. Never throws — the caller logs. */
async function reconcileMutual(
  ctx: CrankContext,
  config: ReconcilerConfig,
  mutual: MutualAccount,
  now: bigint,
): Promise<number> {
  switch (mutual.data.phase) {
    case Phase.Active:
      return await reconcileActive(ctx, config, mutual, now);
    case Phase.Settled:
      return await reconcileSettled(ctx, config, mutual, now);
    case Phase.Dissolved:
      return await reconcileDissolved(ctx, config, mutual);
  }
}

/** Active: settle terminal disputes, then the pool once nothing is pending. */
async function reconcileActive(
  ctx: CrankContext,
  config: ReconcilerConfig,
  mutual: MutualAccount,
  now: bigint,
): Promise<number> {
  const pending = await fetchClaimsOfMutual(ctx.rpc, mutual.address, {
    statuses: [ClaimStatus.Pending],
  });

  let executed = 0;
  for (const claim of pending) {
    // settle_claim reads the ruling directly off the accord Dispute — only
    // terminal disputes (Final ruling / Failed liveness) are crankable; live
    // ones revert DisputeNotFinal, so do not burn a simulation on them.
    const dispute = await fetchMaybeDispute(ctx.rpc, claim.data.dispute);
    if (!dispute.exists) {
      continue;
    }
    if (dispute.data.state === DisputeState.Final || dispute.data.state === DisputeState.Failed) {
      executed += await dispatchAction(ctx, config, {
        kind: "settle_claim",
        mutual: mutual.address,
        claim: claim.address,
      });
    }
  }

  // §2.5: settlement waits for the window AND the last dispute. The mutual
  // snapshot predates this cycle's settle_claim txs — when any ran, let the
  // next cycle read the moved counters instead of failing ClaimsUnresolved.
  const allResolved = executed === 0 && mutual.data.claimsFiled === mutual.data.claimsResolved;
  if (now >= mutual.data.claimsCloseAt && allResolved) {
    executed += await dispatchAction(ctx, config, { kind: "settle_pool", mutual: mutual.address });
  }
  return executed;
}

/** Settled: crank payouts inside the window (pilot: authority only); dissolve after. */
async function reconcileSettled(
  ctx: CrankContext,
  config: ReconcilerConfig,
  mutual: MutualAccount,
  now: bigint,
): Promise<number> {
  if (now < mutual.data.pullCloseAt) {
    if (mutual.data.authority !== ctx.cranker) {
      // Pilot pass gate (ADR-0005 §2.10/§12): claim_payout is authority-gated.
      // Skip rather than simulate-until-Unauthorized; when the on-chain gate
      // retires, delete this check.
      ctx.log(
        "claim_payout",
        mutual.address,
        "skipped: cranker is not the mutual authority (pilot pass gate)",
      );
      return 0;
    }
    const approved = await fetchClaimsOfMutual(ctx.rpc, mutual.address, {
      statuses: [ClaimStatus.Approved],
    });
    let executed = 0;
    for (const claim of approved) {
      executed += await dispatchAction(ctx, config, {
        kind: "claim_payout",
        mutual: mutual.address,
        claim: claim.address,
      });
    }
    return executed;
  }
  return await dispatchAction(ctx, config, { kind: "dissolve", mutual: mutual.address });
}

/** Dissolved: the residual sweep — crank every unsettled, non-zero position. */
async function reconcileDissolved(
  ctx: CrankContext,
  config: ReconcilerConfig,
  mutual: MutualAccount,
): Promise<number> {
  const pool = await fetchPool(ctx.rpc, mutual.data.pool);
  if (pool.data.state !== PoolState.Liquidated) {
    return 0;
  }
  const depositors = await fetchDepositorsOfPool(ctx.rpc, mutual.data.pool);
  let executed = 0;
  for (const depositor of depositors) {
    if (depositor.data.settled || depositor.data.totalAmount === 0n) {
      continue; // already paid out, or burned to 0 by a claim payout (§2.4)
    }
    executed += await dispatchAction(ctx, config, {
      kind: "pool_crank",
      pool: mutual.data.pool,
      owner: depositor.data.owner,
    });
  }
  return executed;
}

/** Dispatch one action; a failed attempt logs and never breaks the cycle. */
async function dispatchAction(
  ctx: CrankContext,
  config: ReconcilerConfig,
  action: CrankAction,
): Promise<number> {
  const log = config.log ?? (() => {});
  if (!config.dispatch.has(action.kind)) {
    log("crank unhandled", { kind: action.kind });
    return 0;
  }
  try {
    await config.dispatch.execute(ctx, action);
    return 1;
  } catch (e) {
    log("crank failed", { kind: action.kind, action, error: errorDigest(e) });
    return 0;
  }
}
