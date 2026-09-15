// harness.spec.ts — riprap-4ma4 checklist: the harness itself boots on a
// Surfnet (env probe → workspace-program check → accord.so deploy → 6-dp
// USDC-like mint → cheatcodes). Offline (no validator) every test here skips,
// which is what keeps `pnpm verify` green without Surfpool.

import { readClock, warpForwardSeconds } from "./setup/cheats.js";
import { ensureAccordProgram } from "./setup/deploy.js";
import { createTestEnv, type TestEnv } from "./setup/env.js";
import { ataOf, createMint, setTokenBalance } from "./setup/tokens.js";

describe("harness: Surfpool boot (riprap-4ma4)", () => {
  let env: TestEnv;

  beforeAll(async () => {
    env = await createTestEnv();
  }, 60_000);

  it("deploys accord.so and mints a USDC-like 6-dp token", async () => {
    if (!env.up) return; // offline CI lane — pnpm verify must stay green

    await ensureAccordProgram(env);
    // (deployed === false on a reused Surfnet — both are a boot)
    const accord = await env.rpc.getAccountInfo(env.accordProgramId).send();
    expect(accord.value).not.toBeNull();
    expect(accord.value?.owner).toBe("BPFLoaderUpgradeab1e11111111111111111111111");
    expect(accord.value?.executable).toBe(true);

    const { mint, authority, decimals } = await createMint(env);
    expect(decimals).toBe(6);
    await setTokenBalance(env, authority.address, mint, 1_000_000n); // 1.000000
    const holderAta = await ataOf(mint, authority.address);
    const balance = await env.rpc.getTokenAccountBalance(holderAta).send();
    expect(balance.value.amount).toBe("1000000");
    expect(balance.value.decimals).toBe(6);
  }, 300_000);

  it("warps the surfnet clock forward (surfnet_timeTravel)", async () => {
    if (!env.up) return;

    const before = await readClock(env);
    const after = await warpForwardSeconds(env, 30);
    expect(after.unixTimestamp).toBeGreaterThanOrEqual(before.unixTimestamp + 30n);
  }, 60_000);
});
