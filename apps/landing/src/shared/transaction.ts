/**
 * transaction.ts — the shared instruction-sending path (ported from the
 * accord dApp, generalized to an instruction bundle).
 *
 * Builds a v0 transaction message from `instructions`, signs it with the
 * provided signer (fee payer), simulates it (pre-flight — program reverts
 * surface as {@link TransactionSendError} with logs), then confirms via
 * subscription. The join path bundles [ATA-create, hanse::join] into ONE
 * signature; single-instruction senders pass a one-element array.
 *
 * This is the only send path in the landing — feature code builds an
 * `Instruction[]` via the SDK facade and hands it here. No priority fees, no
 * blockhash-retry machinery in v1.
 */

import {
  appendTransactionMessageInstructions,
  assertIsTransactionWithBlockhashLifetime,
  createTransactionMessage,
  getBase64EncodedWireTransaction,
  getSignatureFromTransaction,
  type Instruction,
  pipe,
  type Rpc,
  type RpcSubscriptions,
  type SolanaRpcApi,
  type SolanaRpcSubscriptionsApi,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  type TransactionSigner,
} from "@solana/kit";

import { queryClient } from "./queryClient";

/**
 * Thrown when pre-flight transaction simulation fails — i.e. the program
 * reverted before we ever broadcast. Carries the full program `logs`; the
 * verbose `.message` keeps them for the console, while {@link describeError}
 * extracts a clean one-line reason (e.g. the Anchor error-code name) for
 * toasts.
 */
export class TransactionSendError extends Error {
  readonly logs: readonly string[];
  readonly simulationError: unknown;
  constructor(message: string, logs: readonly string[], simulationError: unknown) {
    super(message);
    this.name = "TransactionSendError";
    this.logs = logs;
    this.simulationError = simulationError;
  }
}

/**
 * Send a bundle of instructions as one v0 transaction, signed by `signer`
 * (fee payer), and wait for confirmation.
 *
 * Before broadcasting, the signed message is simulated against a fresh
 * blockhash — a program revert surfaces as a {@link TransactionSendError}
 * carrying the program logs, so the UI can show *why* the instructions
 * failed instead of a generic send failure.
 *
 * @param onSubmitted fires once pre-flight simulation passed and the
 * transaction is being broadcast — the hero's "Confirming…" seam (copy doc §
 * on-chain states). Never fires when the send throws.
 * @returns the transaction signature (base58)
 */
export async function sendInstruction(
  rpc: Rpc<SolanaRpcApi>,
  rpcSubscriptions: RpcSubscriptions<SolanaRpcSubscriptionsApi>,
  signer: TransactionSigner,
  instructions: Instruction[],
  onSubmitted?: () => void,
): Promise<string> {
  const { value: latestBlockhash } = await rpc.getLatestBlockhash().send();
  const message = pipe(
    createTransactionMessage({ version: 0 }),
    (tx) => setTransactionMessageFeePayerSigner(signer, tx),
    (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
    (tx) => appendTransactionMessageInstructions(instructions, tx),
  );
  const signed = await signTransactionMessageWithSigners(message);
  assertIsTransactionWithBlockhashLifetime(signed);

  // Pre-flight: simulate the signed, wire-encoded transaction so a program
  // revert fails fast with its logs — before we pay for broadcast. One wallet
  // interaction: the sign above is reused for the real send below.
  const { value: simulation } = await rpc
    .simulateTransaction(getBase64EncodedWireTransaction(signed), {
      encoding: "base64",
    })
    .send();
  if (simulation.err !== null) {
    const logs = simulation.logs ?? [];
    const reason = String(simulation.err);
    const detail =
      logs.length > 0
        ? `Transaction simulation failed: ${reason}\n${logs.map((l) => `  ${l}`).join("\n")}`
        : `Transaction simulation failed: ${reason}`;
    throw new TransactionSendError(detail, logs, simulation.err);
  }

  // Simulation passed — the transaction is being broadcast now.
  onSubmitted?.();
  const sendAndConfirm = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions,
  });
  await sendAndConfirm(signed, { commitment: "confirmed" });

  // A confirmed tx changed on-chain state — drop every cached read so the
  // next render reflects it (a joined member must not still look coverable).
  void queryClient.invalidateQueries();
  return getSignatureFromTransaction(signed);
}

// --- Error → one-line toast reason -----------------------------------------

/** Walk `.cause` chain to the root error; return its message. */
export function unwrapError(err: unknown): string {
  let current = err;
  let depth = 0;
  while (current instanceof Error && depth < 10) {
    const cause: unknown = current.cause;
    if (!cause) break;
    current = cause;
    depth++;
  }
  if (current instanceof Error) return current.message;
  return String(current);
}

// Priority-ordered regexes that pull the human-meaningful reason out of
// on-chain program logs. Anchor's named errors emit "Error Code: Foo. Error
// Number: N. Error Message: bar." — that pair is the nicest to show, so it
// wins. The rest cover `err!`/msg formats; the final fallback is the last
// "Program log:" line.
const PROGRAM_ERROR_PATTERNS: readonly RegExp[] = [
  /Error Code: (\w+)\. Error Number: \d+\. Error Message: (.+)$/,
  /Program log: AnchorError occurred: (.+?)(?:\.|$)/,
  /Program log: Error: (.+?)(?:\.|$)/,
  /Program log: Custom: (.+?)(?:\.|$)/,
  /^Error: (.+?)(?:\.|$)/,
];

/** Pull the most useful reason line out of program execution logs. */
function extractProgramError(logs: readonly string[]): string | null {
  for (const re of PROGRAM_ERROR_PATTERNS) {
    for (const line of logs) {
      const m = line.match(re);
      if (!m) continue;
      const g2 = m[2];
      const text = g2 !== undefined ? `${m[1]}: ${g2}` : m[1];
      if (text !== undefined) {
        const clean = text.replace(/\.$/, "").trim();
        if (clean) return clean;
      }
    }
  }
  // Last resort: the final "Program log:" line (often the failure reason).
  for (let i = logs.length - 1; i >= 0; i--) {
    const line = logs[i];
    if (!line) continue;
    const m = line.match(/Program log: (.+)$/);
    const g1 = m?.[1];
    if (g1?.trim()) return g1.replace(/\.$/, "").trim();
  }
  return null;
}

/**
 * Turn any error into a short, user-facing message — the sonner toast map.
 * The single helper every toast / inline error in the landing goes through.
 *
 * - `TransactionSendError` (pre-flight simulation revert): extracts the
 *   program error from its logs (e.g. "DepositsClosed: deposits window
 *   closed") so the user sees *why*, not a wall of logs. Falls back to the
 *   RPC error code when the simulation failed before execution (e.g.
 *   "BlockhashNotFound").
 * - Anything else: {@link unwrapError} (walks `.cause` to the root message —
 *   wallets wrap rejections in a generic "Failed to sign").
 */
export function describeError(err: unknown): string {
  if (err instanceof TransactionSendError) {
    const extracted = extractProgramError(err.logs);
    if (extracted) return extracted;
    return `Transaction failed: ${String(err.simulationError)}`;
  }
  return unwrapError(err);
}
