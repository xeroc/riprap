/**
 * sendIx — build, sign, and confirm a single instruction as a v0 transaction
 * with retry + priority-fee escalation on transient send failures
 * (ported from @useaccord/cranker src/send.ts).
 *
 * Simulation/on-chain failures are NOT retried: another cranker may have
 * advanced the state; the next poll cycle re-resolves from chain truth.
 */
import {
  appendTransactionMessageInstructions,
  assertIsTransactionWithBlockhashLifetime,
  type Commitment,
  createTransactionMessage,
  getSignatureFromTransaction,
  type Instruction,
  pipe,
  type Rpc,
  type RpcSubscriptions,
  type SolanaRpcApi,
  type SolanaRpcSubscriptionsApi,
  sendAndConfirmTransactionFactory,
  setTransactionMessageComputeUnitPrice,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  type TransactionSigner,
} from "@solana/kit";

import { log } from "./log.js";

/** Non-retryable: the ix failed simulation or landed but errored on-chain. */
export class SimulationError extends Error {
  constructor(
    message: string,
    readonly logs: string[],
  ) {
    super(message);
    this.name = "SimulationError";
  }
}

/** Retryable send/confirm attempts exhausted. */
export class SendError extends Error {
  constructor(message: string, options?: { cause?: unknown }) {
    super(message);
    this.name = "SendError";
    if (options?.cause !== undefined) {
      this.cause = options.cause;
    }
  }
}

export interface SendConfig {
  rpc: Rpc<SolanaRpcApi>;
  rpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>;
  feePayer: TransactionSigner;
  basePriorityFeeMicroLamports?: bigint;
  priorityFeeEscalationFactor?: number;
  maxRetries?: number;
  commitment?: Commitment;
  log?: (msg: string, fields?: Record<string, unknown>) => void;
}

/**
 * Send one instruction. Returns the tx signature on confirmation.
 * Throws {@link SimulationError} for on-chain/sim failures (caller skips),
 * {@link SendError} after exhausting retries on transient failures.
 */
export async function sendIx(instruction: Instruction, config: SendConfig): Promise<string> {
  const {
    rpc,
    rpcSubscriptions,
    feePayer,
    basePriorityFeeMicroLamports = 10_000n,
    priorityFeeEscalationFactor = 2,
    maxRetries = 3,
    commitment = "confirmed",
    log: logSink = log,
  } = config;

  const sendAndConfirm = sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions });
  const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment }).send();

  let fee = basePriorityFeeMicroLamports;
  let attempt = 0;
  // ponytail: refresh-on-retry (re-fetch blockhash when a retry fires) is the
  // upgrade path if stale-blockhash retries appear; a 60s-poll cranker sending
  // one ix at a time rarely outlives one blockhash window.
  for (;;) {
    attempt++;
    const message = pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayerSigner(feePayer, tx),
      (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      (tx) => setTransactionMessageComputeUnitPrice(fee, tx),
      (tx) => appendTransactionMessageInstructions([instruction], tx),
    );
    const signed = await signTransactionMessageWithSigners(message);
    assertIsTransactionWithBlockhashLifetime(signed);

    try {
      await sendAndConfirm(signed, { commitment });
      const signature = getSignatureFromTransaction(signed);
      logSink("crank tx confirmed", {
        signature,
        attempt,
        priorityFeeMicroLamports: fee.toString(),
      });
      return signature;
    } catch (e: unknown) {
      const logs = extractLogs(e);
      if (logs !== undefined) {
        // Simulation or on-chain error — state moved; skip (do not retry).
        logSink("crank tx simulation failed", { attempt, error: errorDigest(e), logs });
        throw new SimulationError(
          `crank tx failed on-chain (attempt ${attempt}): ${errorDigest(e)}`,
          logs,
        );
      }
      if (attempt >= maxRetries) {
        throw new SendError(`crank tx send failed after ${attempt} attempt(s): ${errorDigest(e)}`, {
          cause: e,
        });
      }
      fee = fee * BigInt(priorityFeeEscalationFactor);
      logSink("crank tx send failed; retrying with higher fee", {
        attempt,
        nextPriorityFeeMicroLamports: fee.toString(),
        error: errorDigest(e),
      });
    }
  }
}

/**
 * Walk a kit error graph for transaction simulation logs. `@solana/kit` nests
 * `{logs: string[]}` at varying depths depending on the failure layer.
 */
export function extractLogs(e: unknown): string[] | undefined {
  const seen = new Set<unknown>();
  const queue: unknown[] = [e];
  while (queue.length > 0) {
    const node = queue.shift();
    if (node === null || typeof node !== "object" || seen.has(node)) {
      continue;
    }
    seen.add(node);
    const record = node as Record<string, unknown>;
    const logs = readLogArray(record);
    if (logs !== undefined && logs.length > 0) {
      return logs;
    }
    for (const value of Object.values(record)) {
      if (value !== null && typeof value === "object") {
        queue.push(value);
      }
    }
  }
  return undefined;
}

/** Read a non-empty string `logs`/`transactionLogs` array off one node, if any. */
function readLogArray(node: Record<string, unknown>): string[] | undefined {
  for (const key of ["logs", "transactionLogs"]) {
    const value = node[key];
    if (Array.isArray(value) && value.length > 0 && value.every((v) => typeof v === "string")) {
      return value as string[];
    }
  }
  return undefined;
}

/** Compact, leak-free digest of an unknown error for log lines. */
export function errorDigest(e: unknown): string {
  if (e instanceof Error) {
    return `${e.name}: ${e.message}`;
  }
  return String(e);
}
