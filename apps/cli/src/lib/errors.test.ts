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
});
