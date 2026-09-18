import { spawnSync } from "node:child_process";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";

import { ed25519 } from "@noble/curves/ed25519";
import { findAssociatedTokenAddress } from "@riprap/pool";
import {
  type Address,
  createKeyPairSignerFromBytes,
  createSolanaRpc,
  type Lamports,
} from "@solana/kit";
import { afterAll, beforeAll, expect, test } from "vitest";

/**
 * Optional Surfpool smoke (bean riprap-7b4e): one happy chain through the
 * CLI itself — pool:init → pool:deposit → pool:spend --dry-run — against a
 * live local validator (Surfpool / solana-test-validator on 127.0.0.1:8899,
 * $RIPRAP_SMOKE_RPC to override). Skips cleanly when no validator is
 * reachable (accord env.up pattern — the probe is a plain cluster-version
 * round-trip, no timers). Deep flows live in @riprap/tests e2e; this lane
 * is CLI-only wiring proof. The mint rig shells out to spl-token/solana
 * (dev tooling, test-only).
 */
const RPC = process.env.RIPRAP_SMOKE_RPC ?? "http://127.0.0.1:8899";
const cliRoot = fileURLToPath(new URL("..", import.meta.url));
const devJs = join(cliRoot, "bin", "dev.js");

const WALLET_SEED = new Uint8Array(32).fill(11);
const WALLET_SECRET = new Uint8Array(64);
WALLET_SECRET.set(WALLET_SEED);
WALLET_SECRET.set(ed25519.getPublicKey(WALLET_SEED), 32);

let keypairPath: string;
let splConfigPath: string;
let live = false;

beforeAll(async () => {
  const dir = mkdtempSync(join(tmpdir(), "riprap-smoke-"));
  keypairPath = join(dir, "id.json");
  writeFileSync(keypairPath, JSON.stringify(Array.from(WALLET_SECRET)));
  // spl-token reads its wallet from the solana CLI config (-C) — and its
  // loader requires all three keys present.
  splConfigPath = join(dir, "spl-config.yml");
  writeFileSync(
    splConfigPath,
    `json_rpc_url: "${RPC}"\nkeypair_path: "${keypairPath}"\nwebsocket_url: "${RPC.replace(/^http/, "ws").replace(/:8899$/, ":8900")}"\n`,
  );

  // Probe: a live validator answers cluster-version AND has the pool
  // program deployed (a bare validator can't run the chain — skip cleanly).
  const probe = spawnSync("solana", ["cluster-version", "--url", RPC], { encoding: "utf8" });
  if (probe.status !== 0) return;
  const account = await createSolanaRpc(RPC)
    .getAccountInfo("63EvHuWaMRSZhD9EPXd7UeW5YFFv41GQUHpv7LpY6wm1" as Address)
    .send();
  live = account.value !== null;
  if (!live) return;
  const wallet = await createKeyPairSignerFromBytes(WALLET_SECRET);
  const rpc = createSolanaRpc(RPC);
  const { value: lamports } = await rpc.getBalance(wallet.address).send();
  if (lamports < 100_000_000n) {
    // Fund via the solana CLI, NOT kit requestAirdrop: on Surfpool the RPC
    // airdrop credits through an internal program that takes account
    // ownership — the wallet then can't pay fees (InvalidAccountForFee).
    // The CLI airdrop lands a normal system account. Same dev-tooling
    // exception as the spl-token rig below.
    const airdrop = spawnSync("solana", ["airdrop", "2", "--url", RPC, wallet.address], {
      encoding: "utf8",
    });
    expect(airdrop.status, airdrop.stderr).toBe(0);
    // Integration exception to no-real-timers: the signal is on-chain state
    // (lamports landing), no event to await — poll with backoff.
    for (let i = 0; i < 50; i++) {
      const { value: l } = await rpc.getBalance(wallet.address).send();
      if (l >= 100_000_000n) break;
      await new Promise((resolve) => setTimeout(resolve, 200));
    }
  }
});
function cli(args: string[]): { status: number | null; stdout: string; stderr: string } {
  return spawnSync("bun", [devJs, ...args, "--json", "--keypair", keypairPath, "--rpc", RPC], {
    encoding: "utf8",
    cwd: cliRoot,
  });
}

function splToken(args: string[]): { status: number | null; stdout: string; stderr: string } {
  return spawnSync("spl-token", ["--config", splConfigPath, ...args], { encoding: "utf8" });
}

afterAll(() => {
  if (keypairPath) rmSync(dirname(keypairPath), { recursive: true, force: true });
});

test("Surfpool smoke: pool:init → deposit → spend --dry-run (skips without a validator)", {
  timeout: 180_000,
}, async () => {
  if (!live) {
    console.info(`[smoke] no validator at ${RPC} — skipping (live wiring proof only)`);
    return;
  }
  const wallet = await createKeyPairSignerFromBytes(WALLET_SECRET);
  const walletAddress = wallet.address;

  // Mint rig: fresh 6-dec token owned by the wallet + 1_000 units in its ATA.
  const createToken = splToken(["create-token", "--decimals", "6"]);
  expect(createToken.status, createToken.stderr).toBe(0);
  const mintMatch = /Creating token (\S+) /.exec(createToken.stdout)?.[1];
  expect(mintMatch, `could not parse mint from: ${createToken.stdout}`).toBeDefined();
  const mint: string = mintMatch as string;
  expect(splToken(["create-account", mint]).status).toBe(0);
  expect(splToken(["mint", mint, "1000"]).status).toBe(0);

  // 1. pool:init — creates the pool PDA + treasury ATA.
  const seed = String(Date.now() % 1_000_000);
  const init = cli([
    "pool:init",
    "--seed",
    seed,
    "--mint",
    mint,
    "--ownership-rate",
    "1",
    "--rights-rate",
    "2",
    "--yield-rate",
    "0",
    "--ownership-authority",
    walletAddress,
    "--rights-authority",
    walletAddress,
    "--yield-authority",
    walletAddress,
  ]);
  expect(init.status, init.stderr).toBe(0);
  const { pool } = JSON.parse(init.stdout);

  // 2. pool:deposit — 1000 raw units into the rights track.
  const deposit = cli(["pool:deposit", "--pool", pool, "--track", "rights", "--amount", "1000"]);
  expect(deposit.status, deposit.stderr).toBe(0);

  // 3. pool:spend --dry-run — wiring proof, no funds move.
  const destination = await findAssociatedTokenAddress(mint as Address, walletAddress);
  const spend = cli([
    "pool:spend",
    "--pool",
    pool,
    "--destination",
    destination,
    "--amount",
    "10",
    "--dry-run",
  ]);
  expect(spend.status, spend.stderr).toBe(0);
  expect(JSON.parse(spend.stdout).programAddress).toBe(
    "63EvHuWaMRSZhD9EPXd7UeW5YFFv41GQUHpv7LpY6wm1",
  );
});
