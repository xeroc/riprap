/**
 * @riprap/cranker — service entry point (framework ported from
 * @useaccord/cranker src/index.ts). Boots the wallet, builds the full crank
 * dispatch, and starts the reconciler poll loop over the mutual lifecycle.
 *
 * All five cranks are permissionless on-chain; the pilot pass gate pins
 * claim_payout to the mutual's authority (ADR-0005) — run the cranker with
 * the operator key during the pilot.
 */
import { type Address, createSolanaRpc, createSolanaRpcSubscriptions } from "@solana/kit";
import { register as registerHanseClaimPayout } from "./cranks/hanse/claim-payout.js";
import { register as registerHanseDissolve } from "./cranks/hanse/dissolve.js";
import { register as registerHanseSettleClaim } from "./cranks/hanse/settle-claim.js";
import { register as registerHanseSettlePool } from "./cranks/hanse/settle-pool.js";
import { register as registerPoolCrank } from "./cranks/pool/crank.js";
import { createCrankDispatch } from "./dispatch.js";
import { log } from "./log.js";
import { reconcileOnce, startReconciler } from "./reconciler.js";
import { sendIx } from "./send.js";
import { loadCrankerWallet } from "./wallet.js";

/** Default poll: lifecycle gates tick in hours/days — 60s IS low latency here. */
const DEFAULT_INTERVAL_MS = 60_000;

function wsCounterpart(rpcUrl: string): string {
  return rpcUrl.replace(/^http/, "ws").replace(/:8899$/, ":8900");
}

function resolveIntervalMs(env: Record<string, string | undefined>): number {
  const raw = env.RIPRAP_CRANKER_INTERVAL_MS;
  if (raw === undefined || raw.trim().length === 0) {
    return DEFAULT_INTERVAL_MS;
  }
  const parsed = Number.parseInt(raw, 10);
  if (!Number.isFinite(parsed) || parsed <= 0) {
    throw new Error(`RIPRAP_CRANKER_INTERVAL_MS must be a positive integer (got "${raw}").`);
  }
  return parsed;
}

function resolveMutuals(env: Record<string, string | undefined>): Address[] | undefined {
  const raw = env.RIPRAP_CRANKER_MUTUALS;
  if (raw === undefined || raw.trim().length === 0) {
    return undefined;
  }
  const list = raw
    .split(",")
    .map((s) => s.trim())
    .filter((s) => s.length > 0);
  return list.length > 0 ? (list as Address[]) : undefined;
}

main().catch((e: unknown) => {
  log("cranker fatal", { error: e instanceof Error ? `${e.name}: ${e.message}` : String(e) });
  process.exit(1);
});

/** Build a dispatch with every crank registered (4 hanse + 1 pool). */
function fullDispatch() {
  const dispatch = createCrankDispatch();
  registerHanseSettleClaim(dispatch);
  registerHanseSettlePool(dispatch);
  registerHanseClaimPayout(dispatch);
  registerHanseDissolve(dispatch);
  registerPoolCrank(dispatch);
  return dispatch;
}

async function main(): Promise<void> {
  const rpcUrl = process.env.RIPRAP_RPC_URL ?? "http://127.0.0.1:8899";
  const wsUrl = process.env.RIPRAP_WS_URL ?? wsCounterpart(rpcUrl);
  const rpc = createSolanaRpc(rpcUrl);
  const rpcSubscriptions = createSolanaRpcSubscriptions(wsUrl);

  const wallet = await loadCrankerWallet(process.env, rpc);
  log("cranker booted", {
    cranker: wallet.address,
    lamports: wallet.balanceLamports.toString(),
    rpc: rpcUrl,
    intervalMs: resolveIntervalMs(process.env),
  });

  const dispatch = fullDispatch();
  const intervalMs = resolveIntervalMs(process.env);
  const mutuals = resolveMutuals(process.env);

  const once = {
    rpc,
    signer: wallet.signer,
    cranker: wallet.address,
    dispatch,
    sendIx: (ix: Parameters<typeof sendIx>[0]) =>
      sendIx(ix, { rpc, rpcSubscriptions, feePayer: wallet.signer, log }),
    mutuals,
    log,
  };

  // --once: single cycle then exit (cron-style / CI probe)
  if (process.env.RIPRAP_CRANKER_ONCE === "1") {
    const executed = await reconcileOnce(once);
    log("cycle complete", { executed });
    return;
  }

  startReconciler({ ...once, intervalMs });
}
