import { describe, expect, test, vi } from "vitest";

import { createCrankDispatch, registerCrank } from "./dispatch.js";
import type { CrankAction, CrankContext } from "./types.js";

const CRANKER = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM" as CrankContext["cranker"];

function fakeContext(): CrankContext {
  return {
    rpc: {} as CrankContext["rpc"],
    signer: {} as CrankContext["signer"],
    cranker: CRANKER,
    sendIx: async () => "sig",
    log: () => {},
  };
}

describe("createCrankDispatch", () => {
  test("register + has + execute roundtrip", async () => {
    const dispatch = createCrankDispatch();
    const seen: CrankAction[] = [];
    dispatch.register("dissolve", async (_ctx, action) => {
      seen.push(action);
    });
    expect(dispatch.has("dissolve")).toBe(true);
    expect(dispatch.has("settle_claim")).toBe(false);

    const action = { kind: "dissolve", mutual: CRANKER } as CrankAction;
    expect(await dispatch.execute(fakeContext(), action)).toBe(true);
    expect(seen).toEqual([action]);
  });

  test("execute returns false for unregistered kinds", async () => {
    const dispatch = createCrankDispatch();
    expect(await dispatch.execute(fakeContext(), { kind: "settle_pool", mutual: CRANKER })).toBe(
      false,
    );
  });

  test("duplicate registration throws", () => {
    const dispatch = createCrankDispatch();
    dispatch.register("dissolve", async () => {});
    expect(() => dispatch.register("dissolve", async () => {})).toThrow(/already registered/);
  });
});

describe("registerCrank", () => {
  test("logs deliberate skips from the executor result", async () => {
    const dispatch = createCrankDispatch();
    const logged: string[] = [];
    registerCrank(dispatch, "settle_pool", async () => ({ skipped: "wrong phase" }));

    const ctx = {
      ...fakeContext(),
      log: (_k: unknown, _s: unknown, msg: string) => logged.push(msg),
    };
    await dispatch.execute(ctx, { kind: "settle_pool", mutual: CRANKER });
    expect(logged).toEqual(["skipped: wrong phase"]);
  });

  test("success results stay silent", async () => {
    const dispatch = createCrankDispatch();
    const logged: string[] = [];
    registerCrank(dispatch, "settle_pool", async () => ({ signature: "sig" }));

    const ctx = {
      ...fakeContext(),
      log: (_k: unknown, _s: unknown, msg: string) => logged.push(msg),
    };
    await dispatch.execute(ctx, { kind: "settle_pool", mutual: CRANKER });
    expect(logged).toEqual([]);
  });

  test("executor failures propagate to the caller (reconciler logs)", async () => {
    const dispatch = createCrankDispatch();
    registerCrank(dispatch, "settle_pool", async () => {
      throw new Error("boom");
    });
    await expect(
      dispatch.execute(fakeContext(), { kind: "settle_pool", mutual: CRANKER }),
    ).rejects.toThrow("boom");
  });
});

// keep vi in scope for future module mocks in this suite
void vi;
