import { createHash } from "node:crypto";

import { findPoolPda as poolFindPoolPda } from "@riprap/pool";
import {
  type Address,
  getAddressEncoder,
  getProgramDerivedAddress,
  getU64Encoder,
  type ReadonlyUint8Array,
} from "@solana/kit";
import { describe, expect, test } from "vitest";

import { HANSE_PROGRAM_ADDRESS } from "../generated/src/generated";
import {
  findClaimPda,
  findFeeFloatPda,
  findMemberAccountPda,
  findMutualPda,
  findMutualSubaccordPda,
  findOwnershipAuthorityPda,
  findPoolPda,
  findRightsAuthorityPda,
  subaccordDomainRef,
} from "./pdas";

const PROGRAM = HANSE_PROGRAM_ADDRESS;
const ALT_PROGRAM = "11111111111111111111111111111111" as Address;
const OWNER = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM" as Address;
const MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address;
const ATA_PROGRAM = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL" as Address;
const TOKEN_PROGRAM = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address;

async function pda(programAddress: Address, seeds: ReadonlyUint8Array[]) {
  return await getProgramDerivedAddress({ programAddress, seeds });
}

describe("findMutualPda", () => {
  // seed layout per programs/hanse/src/state.rs: ["mutual", seed le u64]
  test('seed 0n matches b"mutual" + le u64 layout (state.rs MUTUAL_SEED)', async () => {
    const [mutual] = await findMutualPda({ seed: 0n });
    const [manual] = await pda(PROGRAM, [
      new TextEncoder().encode("mutual"),
      getU64Encoder().encode(0n),
    ]);
    expect(mutual).toBe(manual);
  });

  test("seed 719n (Breakpoint dates) matches manual derivation", async () => {
    const [mutual] = await findMutualPda({ seed: 719n });
    const [manual] = await pda(PROGRAM, [
      new TextEncoder().encode("mutual"),
      getU64Encoder().encode(719n),
    ]);
    expect(mutual).toBe(manual);
  });

  test("distinct seeds derive distinct mutuals (stable)", async () => {
    const [a] = await findMutualPda({ seed: 1n });
    const [a2] = await findMutualPda({ seed: 1n });
    const [b] = await findMutualPda({ seed: 2n });
    expect(a).toBe(a2);
    expect(a).not.toBe(b);
  });

  test("honours programAddress override", async () => {
    const [mutual] = await findMutualPda({ seed: 0n }, { programAddress: ALT_PROGRAM });
    const [manual] = await pda(ALT_PROGRAM, [
      new TextEncoder().encode("mutual"),
      getU64Encoder().encode(0n),
    ]);
    expect(mutual).toBe(manual);
  });
});

describe("findMemberAccountPda", () => {
  // per join.rs / file_claim.rs: ["member", mutual, member]
  test('seeds are b"member" + mutual + claimant (state.rs MEMBER_SEED)', async () => {
    const [mutual] = await findMutualPda({ seed: 0n });
    const [member] = await findMemberAccountPda({ mutual, claimant: OWNER });
    const [manual] = await pda(PROGRAM, [
      new TextEncoder().encode("member"),
      getAddressEncoder().encode(mutual),
      getAddressEncoder().encode(OWNER),
    ]);
    expect(member).toBe(manual);
  });
});

describe("findClaimPda", () => {
  // per file_claim.rs: ["claim", mutual, nonce le u64]
  test('seeds are b"claim" + mutual + nonce le u64 (state.rs CLAIM_SEED)', async () => {
    const [mutual] = await findMutualPda({ seed: 0n });
    const [claim] = await findClaimPda({ mutual, nonce: 3n });
    const [manual] = await pda(PROGRAM, [
      new TextEncoder().encode("claim"),
      getAddressEncoder().encode(mutual),
      getU64Encoder().encode(3n),
    ]);
    expect(claim).toBe(manual);
  });

  test("distinct nonces derive distinct claims", async () => {
    const [mutual] = await findMutualPda({ seed: 0n });
    const [a] = await findClaimPda({ mutual, nonce: 1n });
    const [b] = await findClaimPda({ mutual, nonce: 2n });
    expect(a).not.toBe(b);
  });
});

describe("authority PDAs", () => {
  // per claim_payout.rs / dissolve.rs: ["mutual_auth", mutual] / ["mutual_own", mutual]
  test('rights authority seeds are b"mutual_auth" + mutual', async () => {
    const [mutual] = await findMutualPda({ seed: 0n });
    const [auth] = await findRightsAuthorityPda({ mutual });
    const [manual] = await pda(PROGRAM, [
      new TextEncoder().encode("mutual_auth"),
      getAddressEncoder().encode(mutual),
    ]);
    expect(auth).toBe(manual);
  });

  test('ownership authority seeds are b"mutual_own" + mutual', async () => {
    const [mutual] = await findMutualPda({ seed: 0n });
    const [auth] = await findOwnershipAuthorityPda({ mutual });
    const [manual] = await pda(PROGRAM, [
      new TextEncoder().encode("mutual_own"),
      getAddressEncoder().encode(mutual),
    ]);
    expect(auth).toBe(manual);
  });
});

describe("findFeeFloatPda", () => {
  // per initialize_mutual.rs fee_float ATA (authority = mutual PDA, classic
  // Token program) — layout from spl-associated-token-account 2.3.0:
  // find_program_address([owner, token_program, mint], ATA program)
  test("seeds are mutual + token program + fee mint under the ATA program", async () => {
    const [mutual] = await findMutualPda({ seed: 0n });
    const [feeFloat] = await findFeeFloatPda({ mutual, feeMint: MINT });
    const [manual] = await pda(ATA_PROGRAM, [
      getAddressEncoder().encode(mutual),
      getAddressEncoder().encode(TOKEN_PROGRAM),
      getAddressEncoder().encode(MINT),
    ]);
    expect(feeFloat).toBe(manual);
  });

  test("honours associatedTokenProgramAddress override", async () => {
    const [mutual] = await findMutualPda({ seed: 0n });
    const [feeFloat] = await findFeeFloatPda(
      { mutual, feeMint: MINT },
      { associatedTokenProgramAddress: ALT_PROGRAM },
    );
    const [manual] = await pda(ALT_PROGRAM, [
      getAddressEncoder().encode(mutual),
      getAddressEncoder().encode(TOKEN_PROGRAM),
      getAddressEncoder().encode(MINT),
    ]);
    expect(feeFloat).toBe(manual);
  });
});

describe("subaccordDomainRef + findMutualSubaccordPda", () => {
  const POLICY = new Uint8Array(32).fill(0xab);

  test("domain_ref = sha256('hanse:subaccord' ‖ seed_le ‖ policy_hash) (initialize_mutual.rs)", () => {
    // Independent implementation: node:crypto must agree with @noble/hashes.
    const seed = 719n;
    const h = createHash("sha256");
    h.update("hanse:subaccord");
    h.update(new Uint8Array(new BigInt64Array([seed]).buffer));
    h.update(POLICY);
    expect(Buffer.from(subaccordDomainRef(seed, POLICY)).toString("hex")).toBe(h.digest("hex"));
  });

  test("domain_ref is sensitive to seed and policy_hash (§: policy change ⇒ new subaccord)", () => {
    const base = Buffer.from(subaccordDomainRef(1n, POLICY)).toString("hex");
    const otherPolicy = Buffer.from(subaccordDomainRef(1n, new Uint8Array(32).fill(0xcd))).toString(
      "hex",
    );
    expect(otherPolicy).not.toBe(base);
  });

  test("PDA = ['subaccord', creator, domain_ref] under the accord program", async () => {
    const creator = OWNER;
    const [subaccord] = await findMutualSubaccordPda({ creator, seed: 1n, policyHash: POLICY });
    const [manual] = await pda("cordhVoshqRV6kzGBmM89A66wuusJGsDCvLMHPLyKed" as Address, [
      new TextEncoder().encode("subaccord"),
      getAddressEncoder().encode(creator),
      subaccordDomainRef(1n, POLICY),
    ]);
    expect(subaccord).toBe(manual);
  });
});

describe("pool-side passthroughs", () => {
  test("findPoolPda is @riprap/pool's treasury derivation (e2e convenience)", async () => {
    expect(findPoolPda).toBe(poolFindPoolPda);
    const [treasury] = await findPoolPda({ seed: 0n });
    expect(typeof treasury).toBe("string");
  });
});
