import {
  type Address,
  getAddressEncoder,
  getProgramDerivedAddress,
  getU64Encoder,
} from "@solana/kit";
import { describe, expect, test } from "vitest";

import { POOL_PROGRAM_ADDRESS } from "../generated/src/generated";
import { findDepositorPda, findPoolPda } from "./pdas";

const PROGRAM = POOL_PROGRAM_ADDRESS;
const ALT_PROGRAM = "11111111111111111111111111111111" as Address;

/** seed layout per handoff §2: ["pool", seed le u64] */
async function manualPoolPda(seed: bigint, programAddress: Address = PROGRAM) {
  return await getProgramDerivedAddress({
    programAddress,
    seeds: [new TextEncoder().encode("pool"), getU64Encoder().encode(seed)],
  });
}

describe("findPoolPda", () => {
  test('seed 0n matches handoff §2 layout (b"pool" + le u64)', async () => {
    const [pda] = await findPoolPda({ seed: 0n });
    const [manual] = await manualPoolPda(0n);
    expect(pda).toBe(manual);
  });

  test("seed 719n (Breakpoint dates) matches manual derivation", async () => {
    const [pda] = await findPoolPda({ seed: 719n });
    const [manual] = await manualPoolPda(719n);
    expect(pda).toBe(manual);
  });

  test("distinct seeds derive distinct addresses", async () => {
    const [a] = await findPoolPda({ seed: 1n });
    const [b] = await findPoolPda({ seed: 2n });
    expect(a).not.toBe(b);
  });

  test("honours programAddress override", async () => {
    const [pda] = await findPoolPda({ seed: 0n }, { programAddress: ALT_PROGRAM });
    const [manual] = await manualPoolPda(0n, ALT_PROGRAM);
    expect(pda).toBe(manual);
  });
});

describe("findDepositorPda", () => {
  test('seeds are b"depositor" + pool + owner (handoff §2)', async () => {
    const pool = (await findPoolPda({ seed: 0n }))[0];
    const owner = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM" as Address;
    const [pda] = await findDepositorPda({ pool, owner });
    const [manual] = await getProgramDerivedAddress({
      programAddress: PROGRAM,
      seeds: [
        new TextEncoder().encode("depositor"),
        getAddressEncoder().encode(pool),
        getAddressEncoder().encode(owner),
      ],
    });
    expect(pda).toBe(manual);
  });
});
