import { describe, expect, it } from "vitest";

import { toCliError } from "./errors";

describe("toCliError", () => {
  it("maps a known Anchor custom code to its pool error name", () => {
    // PoolNotOpen = Anchor base (6000) + 0 = 6000 — @riprap/pool errors/pool.ts
    const mapped = toCliError(new Error("Custom program error: #6002"));
    expect(mapped.error).toBe("TrackClosed");
    expect(mapped.message).toBe(
      "The track is closed: its stake rate is zero, deposits cannot mint stake",
    );
    expect(mapped.exitCode).toBe(1);
  });

  it("maps a hex code and an unknown decimal code to Custom_<n>", () => {
    expect(toCliError(new Error("Custom program error: #0x1770")).error).toBe("PoolNotOpen");
    expect(toCliError(new Error("Custom program error: #999999")).error).toBe("Custom_999999");
  });

  it("extracts { Custom: n } nested in a Kit-style error object", () => {
    const err = new Error("instruction error");
    Object.assign(err, { context: { instructionError: { Custom: 6003 } } });
    expect(toCliError(err).error).toBe("Settled");
  });

  it("flags RPC reachability errors with a hint", () => {
    const mapped = toCliError(new Error("fetch failed: ECONNREFUSED 127.0.0.1:8899"));
    expect(mapped.error).toBe("RpcUnreachable");
    expect(mapped.hint).toBeTruthy();
  });

  it("passes through a plain error", () => {
    const mapped = toCliError(new Error("boom"));
    expect(mapped.error).toBe("Error");
    expect(mapped.message).toBe("boom");
  });

  it("carries simulation logs from a kit preflight failure (cause.data.logs)", () => {
    // Shape per @solana/errors 7.1.1: the preflight SolanaError's `cause` is
    // the raw JSON-RPC error; its `data.logs` are the simulation logs.
    const err = new Error("Transaction simulation failed");
    Object.assign(err, {
      name: "SolanaError",
      cause: {
        code: -32005,
        message: "Transaction simulation failed: Error processing Instruction 0",
        data: {
          err: { InstructionError: [0, { Custom: 6002 }] },
          logs: [
            "Program PuuLXN4dNzoZ363h93WZi76NHwbH2AZcafKUqjGgdkf invoke [1]",
            "Program log: Instruction: Deposit",
            "Program PuuLXN4dNzoZ363h93WZi76NHwbH2AZcafKUqjGgdkf failed: custom program error: 0x1772",
          ],
        },
      },
    });
    const mapped = toCliError(err);
    expect(mapped.error).toBe("TrackClosed");
    expect(mapped.logs).toHaveLength(3);
    expect(mapped.logs?.[2]).toContain("0x1772");
  });

  it("carries logs even when no program code is recoverable", () => {
    const err = new Error("Transaction simulation failed");
    Object.assign(err, { context: { logs: ["Program log:foobar"] } });
    const mapped = toCliError(err);
    expect(mapped.error).toBe("Error");
    expect(mapped.logs).toEqual(["Program log:foobar"]);
  });
});
