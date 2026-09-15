import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { ed25519 } from "@noble/curves/ed25519";
import {
  findDepositorPda,
  findPoolPda,
  getBurnInstructionDataDecoder,
  getDepositInstructionDataDecoder,
  getInitInstructionDataDecoder,
  getSpendInstructionDataDecoder,
  getUpdateAuthorityInstructionDataDecoder,
  POOL_PROGRAM_ADDRESS,
  Track,
} from "@riprap/pool";
import { type Address, createKeyPairSignerFromBytes } from "@solana/kit";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

import { findAssociatedTokenAddress } from "../../lib/token";

/**
 * Dry-run instruction snapshots for every pool:* write command, driven
 * through `bin/dev.js` under bun (no validator needed). Each snapshot is
 * verified structurally: program id, account order/roles via the SDK PDA
 * helpers, and instruction args decoded with the SDK data decoders.
 */
const cliRoot = fileURLToPath(new URL("../../..", import.meta.url));
const devJs = join(cliRoot, "bin", "dev.js");

const POOL = "9xQeWvG816bUx9EPa7X8ZyNYBE6yW8zH2XUFmfYqjEEx" as Address;
const MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address;
const DESTINATION = "9WzDXwBbmkg8ZTbNMqUxvQRAyrZzDsGYdLVL9zYtAWWM" as Address;
const OWNER = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL" as Address;
const NEW_AUTHORITY = "TokenkegQfeZyiNwAJbNbGKPFXCWuBvf9Ss623VQ5DA" as Address;

// Fixed-seed keypair: identical wallet address in-process and in the subprocess.
const SEED = new Uint8Array(32).fill(7);
const SECRET = new Uint8Array(64);
SECRET.set(SEED);
SECRET.set(ed25519.getPublicKey(SEED), 32);

let keypairPath: string;
let wallet: Address;
let poolPda: Address;
let treasury: Address;
let ownerAta: Address;
let walletAta: Address;
let initTreasury: Address;
let depositorPdaOfOwner: Address;
let depositorPdaOfWallet: Address;

beforeAll(async () => {
  const dir = mkdtempSync(join(tmpdir(), "riprap-pool-"));
  keypairPath = join(dir, "id.json");
  writeFileSync(keypairPath, JSON.stringify(Array.from(SECRET)));
  wallet = (await createKeyPairSignerFromBytes(SECRET)).address;
  poolPda = (await findPoolPda({ seed: 7n }))[0];
  treasury = await findAssociatedTokenAddress(MINT, POOL);
  ownerAta = await findAssociatedTokenAddress(MINT, OWNER);
  walletAta = await findAssociatedTokenAddress(MINT, wallet);
  initTreasury = await findAssociatedTokenAddress(MINT, poolPda);
  depositorPdaOfOwner = (await findDepositorPda({ pool: POOL, owner: OWNER }))[0];
  depositorPdaOfWallet = (await findDepositorPda({ pool: POOL, owner: wallet }))[0];
});

afterAll(() => {
  rmSync(dirname(keypairPath), { recursive: true, force: true });
});

interface DryRun {
  programAddress: string;
  accounts: { address: string; role: string }[];
  data: string;
}

function dryRun(args: string[]): DryRun {
  const res = spawnSync("bun", [devJs, ...args, "--json", "--dry-run", "--keypair", keypairPath], {
    encoding: "utf8",
    cwd: cliRoot,
  });
  expect(res.status).toBe(0);
  return JSON.parse(res.stdout);
}

function decodeHex(hex: string): Uint8Array {
  return Uint8Array.from(hex.match(/../g)?.map((h) => Number.parseInt(h, 16)) ?? []);
}

test("pool topic help lists all nine commands", () => {
  const res = spawnSync("bun", [devJs, "pool", "--help"], { encoding: "utf8", cwd: cliRoot });
  expect(res.status).toBe(0);
  for (const name of [
    "pool:init",
    "pool:deposit",
    "pool:spend",
    "pool:burn",
    "pool:liquidate",
    "pool:crank",
    "pool:update-authority",
    "pool:show",
    "pool:depositor",
  ]) {
    expect(res.stdout).toContain(name);
  }
});

describe("pool:init --dry-run", () => {
  test("snapshot: seed, rates, authorities, pool PDA, treasury ATA", () => {
    const run = dryRun([
      "pool:init",
      "--seed",
      "7",
      "--mint",
      MINT,
      "--ownership-rate",
      "1",
      "--rights-rate",
      "2",
      "--yield-rate",
      "0",
      "--ownership-authority",
      DESTINATION,
      "--rights-authority",
      OWNER,
      "--yield-authority",
      NEW_AUTHORITY,
    ]);
    expect(run.programAddress).toBe(POOL_PROGRAM_ADDRESS);
    const decoded = getInitInstructionDataDecoder().decode(decodeHex(run.data));
    expect(decoded.seed).toBe(7n);
    expect(decoded.ownershipRate).toBe(1n);
    expect(decoded.rightsRate).toBe(2n);
    expect(decoded.yieldRate).toBe(0n);
    expect(decoded.ownershipAuthority).toBe(DESTINATION);
    expect(decoded.rightsAuthority).toBe(OWNER);
    expect(decoded.yieldAuthority).toBe(NEW_AUTHORITY);
    expect(run.accounts[0]?.address).toBe(wallet); // rentPayer
    expect(run.accounts[1]?.address).toBe(MINT);
    expect(run.accounts[2]?.address).toBe(poolPda);
    expect(run.accounts[3]?.address).toBe(initTreasury);
  });
});

describe("pool:deposit --dry-run", () => {
  test("snapshot: track + amount args, depositor PDA bound to wallet", () => {
    const run = dryRun([
      "pool:deposit",
      "--pool",
      POOL,
      "--track",
      "rights",
      "--amount",
      "1000",
      "--mint",
      MINT,
    ]);
    const decoded = getDepositInstructionDataDecoder().decode(decodeHex(run.data));
    expect(decoded.track).toBe(Track.Rights);
    expect(decoded.amount).toBe(1000n);
    expect(run.accounts[0]?.address).toBe(POOL);
    expect(run.accounts[1]?.address).toBe(depositorPdaOfWallet);
    expect(run.accounts[2]?.address).toBe(wallet); // owner signer
    expect(run.accounts[3]?.address).toBe(wallet); // rent payer defaults to wallet
    expect(run.accounts[4]?.address).toBe(walletAta);
    expect(run.accounts[5]?.address).toBe(treasury);
  });
});

describe("pool:spend --dry-run", () => {
  test("snapshot: amount arg, wallet as rights authority, treasury ATA", () => {
    const run = dryRun([
      "pool:spend",
      "--pool",
      POOL,
      "--destination",
      DESTINATION,
      "--amount",
      "500",
      "--mint",
      MINT,
    ]);
    const decoded = getSpendInstructionDataDecoder().decode(decodeHex(run.data));
    expect(decoded.amount).toBe(500n);
    expect(run.accounts[0]?.address).toBe(POOL);
    expect(run.accounts[1]?.address).toBe(wallet);
    expect(run.accounts[1]?.role).toBe("readonly signer");
    expect(run.accounts[2]?.address).toBe(treasury);
    expect(run.accounts[3]?.address).toBe(DESTINATION);
    expect(run.accounts[3]?.role).toBe("writable");
  });
});

describe("pool:burn --dry-run", () => {
  test("snapshot: track + amount args, depositor PDA bound to --owner", () => {
    const run = dryRun([
      "pool:burn",
      "--pool",
      POOL,
      "--owner",
      OWNER,
      "--track",
      "yield",
      "--amount",
      "3",
    ]);
    const decoded = getBurnInstructionDataDecoder().decode(decodeHex(run.data));
    expect(decoded.track).toBe(Track.Yield);
    expect(decoded.amount).toBe(3n);
    expect(run.accounts[1]?.address).toBe(wallet); // track authority
    expect(run.accounts[2]?.address).toBe(depositorPdaOfOwner);
    expect(run.accounts[3]?.address).toBe(OWNER);
  });
});

describe("pool:liquidate --dry-run", () => {
  test("snapshot: wallet as ownership authority, treasury snapshot", () => {
    const run = dryRun(["pool:liquidate", "--pool", POOL, "--mint", MINT]);
    expect(run.accounts[0]?.address).toBe(POOL);
    expect(run.accounts[1]?.address).toBe(wallet);
    expect(run.accounts[2]?.address).toBe(treasury);
    expect(run.accounts[2]?.role).toBe("readonly"); // snapshot only, no transfer
    expect(decodeHex(run.data).length).toBe(8); // discriminator only
  });
});

describe("pool:crank --dry-run", () => {
  test("snapshot: depositor PDA + owner ATA destination + treasury", () => {
    const run = dryRun(["pool:crank", "--pool", POOL, "--owner", OWNER, "--mint", MINT]);
    expect(run.accounts[0]?.address).toBe(POOL);
    expect(run.accounts[1]?.address).toBe(wallet); // cranker
    expect(run.accounts[2]?.address).toBe(depositorPdaOfOwner);
    expect(run.accounts[3]?.address).toBe(OWNER);
    expect(run.accounts[4]?.address).toBe(ownerAta);
    expect(run.accounts[5]?.address).toBe(treasury);
    expect(decodeHex(run.data).length).toBe(8); // discriminator only
  });
});

describe("pool:update-authority --dry-run", () => {
  test("snapshot: track + new authority args", () => {
    const run = dryRun([
      "pool:update-authority",
      "--pool",
      POOL,
      "--track",
      "ownership",
      "--new",
      NEW_AUTHORITY,
    ]);
    const decoded = getUpdateAuthorityInstructionDataDecoder().decode(decodeHex(run.data));
    expect(decoded.track).toBe(Track.Ownership);
    expect(decoded.new).toBe(NEW_AUTHORITY);
    expect(run.accounts[0]?.address).toBe(POOL);
    expect(run.accounts[1]?.address).toBe(wallet);
  });
});

test("spend without --mint needs the pool account (unreachable rpc errors cleanly)", () => {
  const res = spawnSync(
    "bun",
    [
      devJs,
      "pool:spend",
      "--pool",
      POOL,
      "--destination",
      DESTINATION,
      "--amount",
      "1",
      "--dry-run",
    ],
    {
      encoding: "utf8",
      cwd: cliRoot,
      env: { ...process.env, RIPRAP_RPC_URL: "http://127.0.0.1:1" },
    },
  );
  expect(res.status).not.toBe(0);
  expect(res.stderr).toContain("RpcUnreachable");
});
