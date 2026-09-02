/**
 * Base command hierarchy for the `riprap` CLI.
 *
 * - `BaseCommand` — output flags (`--json` / `--quiet`), the three render
 *   emitters, and the structured `catch()` that maps any throw via
 *   `toCliError` and prints it in the active output mode.
 * - `ChainCommand` — chain flags (`--keypair`, `--rpc`, `--ws`,
 *   `--commitment`, `--dry-run`), `loadChain()` resolving the
 *   {@link ChainContext}, and `sendInstruction()` (build + sign + confirm a
 *   single v0 transaction, single-signer model: the wallet is fee payer and
 *   instruction signer).
 */
import { Command, Flags } from "@oclif/core";
import {
  type AccountRole,
  appendTransactionMessageInstructions,
  assertIsTransactionWithBlockhashLifetime,
  type Commitment,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  getSignatureFromTransaction,
  type Instruction,
  type KeyPairSigner,
  pipe,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
  type TransactionSigner,
} from "@solana/kit";

import { toCliError } from "./errors";
import { accountRoleLabel } from "./format";
import { type OutputFlags, renderCreated, renderRead, renderSend } from "./output";
import { defaultWsEndpoint, loadKeypair, resolveKeypairPath } from "./wallet";

/** Output-mode flags present on every command (pure + chain). */
export const riprapBaseFlags = {
  json: Flags.boolean({
    description: "Emit a single JSON object on stdout (for jq)",
    default: false,
  }),
  quiet: Flags.boolean({
    description: "Only print the signature (send) or address (create/read)",
    char: "q",
    default: false,
  }),
};

/** Chain-touching flags; spread into a {@link ChainCommand}'s `static flags`. */
export const chainFlags = {
  ...riprapBaseFlags,
  rpc: Flags.string({
    description: "Solana JSON-RPC endpoint",
    char: "r",
    env: "RIPRAP_RPC_URL",
    default: "http://127.0.0.1:8899",
  }),
  ws: Flags.string({
    description: "Solana WebSocket endpoint (defaults to the ws counterpart of --rpc)",
    char: "w",
    env: "RIPRAP_WS_URL",
  }),
  keypair: Flags.string({
    description: "Path to keypair JSON ($RIPRAP_KEYPAIR_PATH | $ANCHOR_WALLET)",
    char: "k",
  }),
  commitment: Flags.string({
    description: "Commitment level for send + reads",
    default: "confirmed",
    options: ["processed", "confirmed", "finalized"],
  }),
  "dry-run": Flags.boolean({
    description: "Build + print the instruction (accounts, data hex); do not sign/send",
    default: false,
  }),
};

/**
 * Kit v7 derives the rpc client type from the transport (`createSolanaRpc`
 * returns `RpcFromTransport<…>`); there is no exported `SolanaRpc` name, so
 * these aliases ARE the named contracts consumers import.
 */
export type ChainRpc = ReturnType<typeof createSolanaRpc>;
export type ChainRpcSubscriptions = ReturnType<typeof createSolanaRpcSubscriptions>;
/** The function returned by kit's `sendAndConfirmTransactionFactory`. */
export type SendAndConfirm = ReturnType<typeof sendAndConfirmTransactionFactory>;

/** Resolved chain context handed to a {@link ChainCommand}'s `run()`. */
export interface ChainContext {
  rpc: ChainRpc;
  rpcSubscriptions: ChainRpcSubscriptions;
  sendAndConfirm: SendAndConfirm;
  signer: KeyPairSigner;
  ws: string;
  commitment: Commitment;
}

export abstract class BaseCommand extends Command {
  /** Output-mode flags, captured after parse so `catch()` can read them. */
  protected out: OutputFlags = {};

  /** Capture output flags from a parsed flag set (call once after `this.parse`). */
  protected applyOutput(flags: OutputFlags): void {
    this.out = { json: flags.json, quiet: flags.quiet };
  }

  // -- emitters: log the rendered string for the active output mode ----------

  protected emitSend(signature: string, extra: Record<string, unknown> = {}): void {
    this.log(renderSend(this.out, signature, extra));
  }

  protected emitCreated(address: string, extra: Record<string, unknown> = {}): void {
    this.log(renderCreated(this.out, address, extra));
  }

  protected emitRead(data: unknown, opts: { primary?: string; human?: string[] } = {}): void {
    this.log(renderRead(this.out, data, opts));
  }

  /**
   * oclif error hook. Maps any thrown value via {@link toCliError} and prints in
   * the active output mode: `--json` ⇒ `{ error, message, hint? }` on stderr;
   * human ⇒ the message + hint on stderr. Exits non-zero.
   */
  protected async catch(err: Error & { oclif?: { exit?: number } }): Promise<unknown> {
    if (err?.oclif?.exit !== undefined) {
      // oclif's own structured errors (e.g. missing required flag) — let it handle.
      return super.catch(err);
    }
    const cliError = toCliError(err);
    if (this.out.json) {
      process.stderr.write(
        `${JSON.stringify({
          error: cliError.error,
          message: cliError.message,
          hint: cliError.hint,
        })}\n`,
      );
    } else {
      process.stderr.write(`✗ ${cliError.error}: ${cliError.message}\n`);
      if (cliError.hint) process.stderr.write(`  hint: ${cliError.hint}\n`);
    }
    this.exit(cliError.exitCode);
  }
}

export abstract class ChainCommand extends BaseCommand {
  static flags = chainFlags;

  /**
   * Resolve the chain context from flags: load the keypair (single-signer
   * model), create the rpc + subscription clients, and bind the
   * sendAndConfirm factory.
   */
  protected async loadChain(flags: {
    rpc: string;
    ws?: string;
    keypair?: string;
    commitment: string;
  }): Promise<ChainContext> {
    const signer = await loadKeypair(resolveKeypairPath(flags.keypair));
    const ws = flags.ws ?? defaultWsEndpoint(flags.rpc);
    const rpc = createSolanaRpc(flags.rpc);
    const rpcSubscriptions = createSolanaRpcSubscriptions(ws);
    return {
      rpc,
      rpcSubscriptions,
      sendAndConfirm: sendAndConfirmTransactionFactory({ rpc, rpcSubscriptions }),
      signer,
      ws,
      commitment: flags.commitment as Commitment,
    };
  }

  /**
   * Build, sign, and confirm a single instruction as a v0 transaction. The
   * loaded signer is both fee payer and the instruction's signing account.
   */
  protected async sendInstruction(ctx: ChainContext, instruction: Instruction): Promise<string> {
    const { rpc, sendAndConfirm, signer, commitment } = ctx;

    const { value: latestBlockhash } = await rpc.getLatestBlockhash({ commitment }).send();

    const message = pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayerSigner(signer as TransactionSigner, tx),
      (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      (tx) => appendTransactionMessageInstructions([instruction], tx),
    );

    const signed = await signTransactionMessageWithSigners(message);
    assertIsTransactionWithBlockhashLifetime(signed);
    await sendAndConfirm(signed, { commitment });
    return getSignatureFromTransaction(signed);
  }

  /** `--dry-run` dump: program, accounts (with roles), instruction data hex. */
  protected emitDryRun(instruction: Instruction): void {
    const accounts = (instruction.accounts ?? []).map((m) => ({
      address: m.address,
      role: accountRoleLabel(m.role as AccountRole),
    }));
    const data = instruction.data ? new Uint8Array(instruction.data) : new Uint8Array();
    const dataHex = toHex(data);
    if (this.out.json) {
      this.log(
        JSON.stringify({ programAddress: instruction.programAddress, accounts, data: dataHex }),
      );
    } else {
      const lines = [
        "[dry-run] instruction built; not sending.",
        `  program : ${instruction.programAddress}`,
      ];
      for (const [i, a] of accounts.entries()) {
        lines.push(`  acct[${i}] : ${a.address}  (${a.role})`);
      }
      lines.push(`  data    : ${dataHex}`);
      this.log(lines.join("\n"));
    }
  }
}

/** Uint8Array → lowercase hex string (no `0x` prefix). */
function toHex(bytes: Uint8Array): string {
  const head = Array.from(bytes.slice(0, 256))
    .map((b) => b.toString(16).padStart(2, "0"))
    .join("");
  return bytes.length > 256 ? `${head}… (+${bytes.length - 256} bytes)` : head;
}
