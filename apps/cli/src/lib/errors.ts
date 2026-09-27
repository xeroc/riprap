/**
 * Error mapping for the Riprap CLI.
 *
 * On-chain program failures arrive as generic JS errors whose message embeds an
 * Anchor custom code (`Custom program error: #0xNN`, base 6000). This module
 * decodes that code against the pool program's error map (from `@riprap/pool`)
 * so the CLI can emit a stable `{ error, message }` shape and a human hint.
 * Hanse error codes join here when `@riprap/hanse` lands.
 */
import {
  getPoolErrorMessage,
  POOL_ERROR__MATH_OVERFLOW,
  POOL_ERROR__POOL_NOT_LIQUIDATED,
  POOL_ERROR__POOL_NOT_OPEN,
  POOL_ERROR__SETTLED,
  POOL_ERROR__TRACK_CLOSED,
} from "@riprap/pool";

export interface CliError {
  exitCode: number;
  /** Stable machine code — a pool error name when known, else the raw tag. */
  error: string;
  message: string;
  hint?: string;
  /** Transaction simulation/confirmation logs when kit attached them — the
   * program's own log lines, including Anchor's `Error Code:` diagnostics. */
  logs?: string[];
}

/** Anchor custom-error base for the pool program (error codes start at 6000). */
const ANCHOR_ERROR_CODE_OFFSET = 6000;

/** Reverse index: Anchor code → `{ name, message }`. Built once. */
const codeIndex: Record<number, { name: string; message: string }> = {
  [POOL_ERROR__POOL_NOT_OPEN]: {
    name: "PoolNotOpen",
    message: getPoolErrorMessage(POOL_ERROR__POOL_NOT_OPEN),
  },
  [POOL_ERROR__POOL_NOT_LIQUIDATED]: {
    name: "PoolNotLiquidated",
    message: getPoolErrorMessage(POOL_ERROR__POOL_NOT_LIQUIDATED),
  },
  [POOL_ERROR__TRACK_CLOSED]: {
    name: "TrackClosed",
    message: getPoolErrorMessage(POOL_ERROR__TRACK_CLOSED),
  },
  [POOL_ERROR__SETTLED]: { name: "Settled", message: getPoolErrorMessage(POOL_ERROR__SETTLED) },
  [POOL_ERROR__MATH_OVERFLOW]: {
    name: "MathOverflow",
    message: getPoolErrorMessage(POOL_ERROR__MATH_OVERFLOW),
  },
};

/**
 * Kit v7 nests the Anchor instruction error as `{ Custom: <code> }` somewhere
 * inside a `SolanaError`; recurse to find that variant. (We deliberately do
 * NOT match bare numbers — Solana runtime codes like 4615026 would false-match.)
 */
function findCustomCode(value: unknown, depth: number): number | null {
  if (depth > 5) return null; // bounded — also breaks circular refs.
  if (typeof value !== "object" || value === null) return null;
  if ("Custom" in value && typeof value.Custom === "number") return value.Custom;
  for (const v of Object.values(value)) {
    const found = findCustomCode(v, depth + 1);
    if (found !== null) return found;
  }
  return null;
}

/**
 * Kit nests the simulation logs as a `logs` array somewhere inside the thrown
 * `SolanaError` (exact depth depends on the failure path: preflight
 * simulation vs confirmation). Bounded recursion, mirroring
 * {@link findCustomCode}, finds the first all-string `logs` array.
 */
function findLogs(value: unknown, depth: number): string[] | null {
  if (depth > 5) return null;
  if (typeof value !== "object" || value === null) return null;
  if ("logs" in value) {
    const candidate = value.logs;
    if (
      Array.isArray(candidate) &&
      candidate.length > 0 &&
      candidate.every((line) => typeof line === "string")
    ) {
      return candidate as string[];
    }
  }
  for (const nested of Object.values(value)) {
    const found = findLogs(nested, depth + 1);
    if (found !== null) return found;
  }
  return null;
}

function messageOf(err: unknown): string {
  if (err instanceof Error) return err.message;
  if (typeof err === "string") return err;
  return String(err);
}

/** Find an integer program error code embedded in an error or its message. */
function extractProgramCode(err: unknown): number | null {
  const fromObj = findCustomCode(err, 0);
  if (fromObj !== null) return fromObj;

  const msg = messageOf(err);
  // Anchor/Solana formats: "Custom program error: #0x65" (hex) or "#101" (dec).
  const hexGroup = msg.match(/#0x([0-9a-fA-F]+)/)?.[1];
  if (hexGroup) return Number.parseInt(hexGroup, 16);
  const decGroup = msg.match(/#(\d+)\b/)?.[1];
  if (decGroup) return Number.parseInt(decGroup, 10);
  return null;
}

/** Map any thrown value to a structured CLI error. */
export function toCliError(err: unknown): CliError {
  const code = extractProgramCode(err);
  const known = code !== null ? codeIndex[code] : undefined;
  const logs = findLogs(err, 0) ?? undefined;

  if (known) {
    return { exitCode: 1, error: known.name, message: known.message, logs };
  }

  const msg = messageOf(err);
  // RPC reachability is common enough to deserve a targeted hint.
  if (/ECONNREFUSED|fetch failed|Failed to fetch|getaddrinfo|unable to connect/i.test(msg)) {
    return {
      exitCode: 1,
      error: "RpcUnreachable",
      message: msg,
      hint: "Is a validator/Surfpool running at the configured --rpc / $RIPRAP_RPC_URL?",
      logs,
    };
  }

  if (code !== null) {
    return {
      exitCode: 1,
      error: `Custom_${code}`,
      message: msg,
      hint: `Program error code ${code} (Anchor base ${ANCHOR_ERROR_CODE_OFFSET}). Not in the known pool error map.`,
      logs,
    };
  }

  return { exitCode: 1, error: err instanceof Error ? err.name : "Error", message: msg, logs };
}
