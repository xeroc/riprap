// env.ts — the single place jest specs reach Surfpool + the send pipeline.
//
// Ported from the accord harness (accord/tests/src/setup/env.ts). Riprap
// deltas: env prefix RIPRAP_*; no SDK facade — @riprap/pool and @riprap/hanse
// are Codama instruction factories, specs build instructions with them and
// send through `sendIx`/`sendIxs`; workspace programs (pool, hanse) are
// deployed by `anchor test`, accord.so by setup/deploy.ts in beforeAll.
//
// Every spec calls `createTestEnv()` in `beforeAll` and gates on `env.up`
// (offline CI lane — `pnpm verify` must stay green without a validator).

import { readFileSync } from "node:fs";
import { homedir } from "node:os";
import { setTimeout as sleep } from "node:timers/promises";
import { HANSE_PROGRAM_ADDRESS } from "@riprap/hanse";
import { POOL_PROGRAM_ADDRESS } from "@riprap/pool";
import {
  type Address,
  appendTransactionMessageInstructions,
  assertIsTransactionWithBlockhashLifetime,
  type Blockhash,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  createSolanaRpcSubscriptions,
  createTransactionMessage,
  generateKeyPairSigner,
  getBase64EncodedWireTransaction,
  getSignatureFromTransaction,
  type Instruction,
  type KeyPairSigner,
  lamports,
  pipe,
  type Rpc,
  type SolanaRpcApi,
  sendAndConfirmTransactionFactory,
  setTransactionMessageFeePayerSigner,
  setTransactionMessageLifetimeUsingBlockhash,
  signTransactionMessageWithSigners,
} from "@solana/kit";
import { ACCORD_PROGRAM_ID } from "@useaccord/sdk";

/** The published contract every spec consumes. `sendAndConfirm`/`subs` stay
 * module-private (closure-captured by `sendIx`) so the surface stays minimal. */
export interface TestEnv {
  /** `false` ⇒ no validator reachable; specs skip (offline CI lane). */
  readonly up: boolean;
  /** JSON-RPC URL — `setup/cheats.ts` POSTs `surfnet_*` cheatcodes here. */
  readonly rpcUrl: string;
  readonly rpc: Rpc<SolanaRpcApi>;
  readonly payer: KeyPairSigner;
  /** Workspace program ids (Anchor.toml [programs.localnet]) via the SDKs. */
  readonly poolProgramId: Address;
  readonly hanseProgramId: Address;
  /** Sibling-repo accord program id (deployed by setup/deploy.ts). */
  readonly accordProgramId: Address;
  sendIx(instruction: Instruction): Promise<string>;
  /** Multi-instruction tx (same payer/blockhash) — setup/deploy.ts pairs
   * system CreateAccount with its loader instruction, as the loader requires. */
  sendIxs(instructions: Instruction[], opts?: SendIxsOptions): Promise<string>;
}

export interface SendIxsOptions {
  /** Reuse a caller-fetched blockhash (deploy write batches). Structural —
   * kit 7.1.1 does not re-export BlockhashWithExpiryBlockHeight. */
  blockhash?: { blockhash: Blockhash; lastValidBlockHeight: bigint };
  /** Fire-and-forget: send without per-tx confirmation; the caller confirms
   * out-of-band (setup/deploy.ts polls the buffer length, Deploy verifies the
   * ELF). Cuts a 790-tx program deploy from minutes to seconds. */
  skipConfirm?: boolean;
}

export interface TestEnvOptions {
  endpoint?: string;
  wsEndpoint?: string;
  payerPath?: string;
}

const DEFAULT_RPC = process.env.RIPRAP_RPC_URL ?? "http://127.0.0.1:8899";
const DEFAULT_WS = process.env.RIPRAP_WS_URL ?? "ws://127.0.0.1:8900";
const DEFAULT_PAYER = process.env.RIPRAP_PAYER_PATH ?? `${homedir()}/.config/solana/id.json`;

const MIN_PAYER_LAMPORTS = lamports(BigInt(0.1e9));
const TOPUP_LAMPORTS = lamports(BigInt(2e9));

function loadPayerBytes(path: string): Uint8Array {
  return new Uint8Array(JSON.parse(readFileSync(path, "utf-8")));
}

/** Cheap RPC probe. Never throws — resolves `false` so specs can skip cleanly. */
async function isValidatorUp(rpc: Rpc<SolanaRpcApi>): Promise<boolean> {
  try {
    await rpc.getEpochInfo().send();
    return true;
  } catch {
    return false;
  }
}

/**
 * Spin up the shared harness. Probes the validator, funds the payer, and wires
 * `sendIx`/`sendIxs`. Throws loudly (not skip) if a validator is up but a
 * workspace program isn't deployed — that's a misconfigured `anchor test` run,
 * not an offline-lane run.
 */
export async function createTestEnv(opts: TestEnvOptions = {}): Promise<TestEnv> {
  const endpoint = opts.endpoint ?? DEFAULT_RPC;
  const wsEndpoint = opts.wsEndpoint ?? DEFAULT_WS;
  const payerPath = opts.payerPath ?? DEFAULT_PAYER;

  const rpc = createSolanaRpc(endpoint);
  const up = await isValidatorUp(rpc);

  // Probe BEFORE the payer load: with no validator the keypair is never used,
  // so a machine without ~/.config/solana/id.json still gets a clean skip.
  let payer: KeyPairSigner;
  if (up) {
    try {
      payer = await createKeyPairSignerFromBytes(loadPayerBytes(payerPath));
    } catch (e) {
      throw new Error(
        `TestEnv: cannot load payer keypair at ${payerPath} ` +
          `(set RIPRAP_PAYER_PATH or run \`solana-keygen new -o ${DEFAULT_PAYER}\`): ${String(e)}`,
      );
    }
  } else {
    payer = await generateKeyPairSigner();
  }

  // Always wire the pipeline — it's lazy; nothing connects until `sendIx`.
  const subs = createSolanaRpcSubscriptions(wsEndpoint);
  const sendAndConfirm = sendAndConfirmTransactionFactory({
    rpc,
    rpcSubscriptions: subs,
  });

  const sendIxs = async (
    instructions: Instruction[],
    opts: SendIxsOptions = {},
  ): Promise<string> => {
    const latestBlockhash = opts.blockhash ?? (await rpc.getLatestBlockhash().send()).value;
    const message = pipe(
      createTransactionMessage({ version: 0 }),
      (tx) => setTransactionMessageFeePayerSigner(payer, tx),
      (tx) => setTransactionMessageLifetimeUsingBlockhash(latestBlockhash, tx),
      (tx) => appendTransactionMessageInstructions(instructions, tx),
    );
    const signed = await signTransactionMessageWithSigners(message);
    assertIsTransactionWithBlockhashLifetime(signed);
    if (opts.skipConfirm) {
      await rpc
        .sendTransaction(getBase64EncodedWireTransaction(signed), {
          encoding: "base64",
          skipPreflight: true,
        })
        .send();
      return getSignatureFromTransaction(signed);
    }
    try {
      await sendAndConfirm(signed, { commitment: "confirmed" });
    } catch (e: unknown) {
      // Surface the program logs so failures aren't opaque "Custom program
      // error: #NNNN" — walk the error chain to find logs from the RPC layer.
      const logs = extractLogs(e);
      if (logs?.length) {
        console.error(`[sendIx] Transaction failed. Program logs:\n  ${logs.join("\n  ")}`);
      }
      throw e;
    }
    return getSignatureFromTransaction(signed);
  };

  if (up) {
    // anchor test deploys the workspace programs before the [scripts] runner;
    // probe both so a stale Surfnet fails fast with the fix in the message.
    for (const [programId, name] of [
      [POOL_PROGRAM_ADDRESS, "pool"],
      [HANSE_PROGRAM_ADDRESS, "hanse"],
    ] as const) {
      const account = await rpc.getAccountInfo(programId).send();
      if (account.value === null) {
        throw new Error(
          `TestEnv: ${name} program not deployed at ${programId}. ` +
            "Run `anchor test` (builds, starts Surfpool, deploys pool + hanse) " +
            "or build with `anchor build` and restart the validator.",
        );
      }
    }

    const balance = await rpc.getBalance(payer.address).send();
    if (balance.value < MIN_PAYER_LAMPORTS) {
      await rpc.requestAirdrop(payer.address, TOPUP_LAMPORTS).send();
      await sleep(500);
    }
  }

  return {
    up,
    rpcUrl: endpoint,
    rpc,
    payer,
    poolProgramId: POOL_PROGRAM_ADDRESS,
    hanseProgramId: HANSE_PROGRAM_ADDRESS,
    accordProgramId: ACCORD_PROGRAM_ID,
    sendIx: (instruction) => sendIxs([instruction]),
    sendIxs,
  };
}

/**
 * Generate a fresh keypair and airdrop it SOL. Use for members/crankers —
 * on-chain `init`s make them the rent payer for their own accounts and ATAs,
 * so any address that owns created state must hold SOL.
 */
export async function fundSigner(
  env: TestEnv,
  amount = 500_000_000n, // ~0.5 SOL — rent for member accounts + entry ATAs
): Promise<KeyPairSigner> {
  const signer = await generateKeyPairSigner();
  await env.rpc.requestAirdrop(signer.address, lamports(amount)).send();
  await sleep(400);
  return signer;
}

/**
 * Walk an error's cause chain to extract transaction simulation logs.
 * Solana Kit wraps RPC errors in nested `cause` layers — this tries
 * `transactionLogs` then `logs` at each level. Uses `in` narrowing
 * (no unchecked casts).
 */
function extractLogs(e: unknown): string[] | undefined {
  let cur: unknown = e;
  for (let depth = 0; depth < 6 && cur !== null && cur !== undefined; depth++) {
    if (typeof cur !== "object") break;
    if ("transactionLogs" in cur) {
      const candidate = cur.transactionLogs;
      if (Array.isArray(candidate)) {
        return candidate.filter((v): v is string => typeof v === "string");
      }
    }
    if ("logs" in cur) {
      const candidate = cur.logs;
      if (Array.isArray(candidate)) {
        return candidate.filter((v): v is string => typeof v === "string");
      }
    }
    // kit's SolanaError nests them under `context.logs` — narrow, no casts
    if ("context" in cur) {
      const ctx = cur.context;
      if (ctx !== null && typeof ctx === "object" && "logs" in ctx) {
        const candidate = ctx.logs;
        if (Array.isArray(candidate)) {
          return candidate.filter((v): v is string => typeof v === "string");
        }
      }
    }
    cur = "cause" in cur ? cur.cause : null;
  }
  return undefined;
}
