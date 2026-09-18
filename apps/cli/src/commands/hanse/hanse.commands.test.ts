import { spawnSync } from "node:child_process";
import { createHash } from "node:crypto";
import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { dirname, join } from "node:path";
import { fileURLToPath } from "node:url";
import { ed25519 } from "@noble/curves/ed25519";
import {
  findDepositorPda,
  findJoinMemberAccountPda,
  findMutualPda,
  findMutualSubaccordPda,
  findOwnershipAuthorityPda,
  findPoolPda,
  getInitializeMutualInstructionDataDecoder,
  getJoinInstructionDataDecoder,
  getSetSubaccordParamInstructionDataDecoder,
  HANSE_PROGRAM_ADDRESS,
} from "@riprap/hanse";
import { findAssociatedTokenAddress } from "@riprap/pool";
import { type Address, createKeyPairSignerFromBytes } from "@solana/kit";
import { findPendingUpdatePda } from "@useaccord/sdk";
import { afterAll, beforeAll, describe, expect, test } from "vitest";

/**
 * Dry-run instruction snapshots for every hanse:* command that can build
 * offline (initialize is fully explicit; join/dissolve/settle-pool take
 * --pool/--deposit-mint overrides; set-subaccord-param takes --subaccord).
 * Snapshots are verified structurally: program id, account order via the
 * SDK PDA helpers, and args decoded with the SDK data decoders — the
 * pool.commands.test.ts pattern. file-claim / settle-claim / claim-payout
 * need live chain state and are covered by hanse.build.test.ts.
 */
const cliRoot = fileURLToPath(new URL("../../..", import.meta.url));
const devJs = join(cliRoot, "bin", "dev.js");

const POOL_OVERRIDE = "9xQeWvG816bUx9EPa7X8ZyNYBE6yW8zH2XUFmfYqjEEx" as Address;
const DEPOSIT_MINT = "EPjFWdd5AufqSSqeM2qN1xzybapC8G4wEGGkZwyTDt1v" as Address;
const FEE_MINT = DEPOSIT_MINT; // single-asset MVP: program rejects mixed mints
const EVIDENCE_OPERATOR = "ATokenGPvbdGVxr1b2hvZbsiqW5xWH25efTNsLJA8knL" as Address;
const POLICY_HASH = createHash("sha256").update("policy").digest("hex");
const SEED = 7n;

// Fixed-seed keypair: identical wallet address in-process and in the subprocess.
const WALLET_SEED = new Uint8Array(32).fill(7);
const WALLET_SECRET = new Uint8Array(64);
WALLET_SECRET.set(WALLET_SEED);
WALLET_SECRET.set(ed25519.getPublicKey(WALLET_SEED), 32);

// Fixed-seed sponsor keypair, same trick.
const SPONSOR_SEED = new Uint8Array(32).fill(11);
const SPONSOR_SECRET = new Uint8Array(64);
SPONSOR_SECRET.set(SPONSOR_SEED);
SPONSOR_SECRET.set(ed25519.getPublicKey(SPONSOR_SEED), 32);
let keypairPath: string;
let wallet: Address;
let mutualPda: Address;
let poolPda: Address;
let treasury: Address;
let subaccordPda: Address;
let memberAccountPda: Address;
let depositorPda: Address;
let overrideTreasury: Address;
let ownershipAuthorityPda: Address;
let sponsor: Address;

beforeAll(async () => {
  const dir = mkdtempSync(join(tmpdir(), "riprap-hanse-"));
  keypairPath = join(dir, "id.json");
  writeFileSync(keypairPath, JSON.stringify(Array.from(WALLET_SECRET)));
  wallet = (await createKeyPairSignerFromBytes(WALLET_SECRET)).address;
  mutualPda = (await findMutualPda({ seed: SEED }))[0];
  poolPda = (await findPoolPda({ seed: SEED }))[0];
  treasury = await findAssociatedTokenAddress(DEPOSIT_MINT, poolPda);
  subaccordPda = (
    await findMutualSubaccordPda({
      creator: wallet,
      seed: SEED,
      policyHash: Uint8Array.from(
        POLICY_HASH.match(/../g)?.map((h: string) => Number.parseInt(h, 16)) ?? [],
      ),
    })
  )[0];
  memberAccountPda = (await findJoinMemberAccountPda({ mutual: mutualPda, member: wallet }))[0];
  depositorPda = (await findDepositorPda({ pool: POOL_OVERRIDE, owner: wallet }))[0];
  overrideTreasury = await findAssociatedTokenAddress(DEPOSIT_MINT, POOL_OVERRIDE);
  ownershipAuthorityPda = (await findOwnershipAuthorityPda({ mutual: mutualPda }))[0];
  sponsor = (await createKeyPairSignerFromBytes(SPONSOR_SECRET)).address;
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

const INIT_ARGS = [
  "--seed",
  "7",
  "--tier",
  "10000000:1000000000",
  "--tier",
  "20000000:2000000000",
  "--tier",
  "40000000:4000000000",
  "--policy-hash",
  POLICY_HASH,
  "--deposits-close-at",
  "1763174400",
  "--claims-close-at",
  "1793469600",
  "--deposit-mint",
  DEPOSIT_MINT,
  "--fee-mint",
  FEE_MINT,
  "--min-stake",
  "10000000",
  "--alpha-bps",
  "1000",
  "--review-window",
  "172800",
  "--commit-window",
  "43200",
  "--reveal-window",
  "43200",
  "--appeal-window",
  "172800",
  "--max-appeals",
  "2",
  "--min-jury-size",
  "3",
  "--fee-per-juror",
  "5000000",
  "--reveal-threshold-bps",
  "6666",
  "--max-draw-attempts",
  "3",
  "--evidence-operator",
  EVIDENCE_OPERATOR,
];

test("hanse topic help lists all twelve commands", () => {
  const res = spawnSync("bun", [devJs, "hanse", "--help"], { encoding: "utf8", cwd: cliRoot });
  expect(res.status).toBe(0);
  for (const name of [
    "hanse:initialize",
    "hanse:join",
    "hanse:file-claim",
    "hanse:settle-claim",
    "hanse:settle-pool",
    "hanse:claim-payout",
    "hanse:dissolve",
    "hanse:set-subaccord-param",
    "hanse:show",
    "hanse:claim",
    "hanse:member",
    "hanse:quote",
  ]) {
    expect(res.stdout).toContain(name);
  }
});

describe("hanse:initialize --dry-run", () => {
  test("snapshot: §12 pilot args decoded; PDAs bound to wallet + seed", () => {
    const run = dryRun(["hanse:initialize", ...INIT_ARGS]);
    expect(run.programAddress).toBe(HANSE_PROGRAM_ADDRESS);
    expect(run.accounts[0]?.address).toBe(wallet); // authority signer (demo admin)
    expect(run.accounts[0]?.role).toContain("signer");
    expect(run.accounts[1]?.address).toBe(wallet); // rent payer (sponsor slot)
    expect(run.accounts[1]?.role).toContain("signer");
    expect(run.accounts[2]?.address).toBe(mutualPda);
    expect(run.accounts[3]?.address).toBe(poolPda);
    expect(run.accounts[4]?.address).toBe(treasury);
    expect(run.accounts[5]?.address).toBe(subaccordPda);

    const decoded = getInitializeMutualInstructionDataDecoder().decode(decodeHex(run.data));
    expect(decoded.seed).toBe(7n);
    expect(decoded.tiers).toEqual([
      { contribution: 10_000_000n, maxPayout: 1_000_000_000n },
      { contribution: 20_000_000n, maxPayout: 2_000_000_000n },
      { contribution: 40_000_000n, maxPayout: 4_000_000_000n },
    ]);
    expect(decoded.policyHash).toEqual(decodeHex(POLICY_HASH));
    expect(decoded.depositsCloseAt).toBe(1_763_174_400n);
    expect(decoded.claimsCloseAt).toBe(1_793_469_600n);
    expect(decoded.subaccord.minJurySize).toBe(3);
    expect(decoded.subaccord.feePerJuror).toBe(5_000_000n);
    expect(decoded.subaccord.alphaBps).toBe(1000);
  });
  test("wrong tier count is rejected before any chain load", () => {
    // Same args minus one --tier pair: only Basic/Standard remain.
    const twoTiers = ["hanse:initialize", ...INIT_ARGS.slice(0, 6), ...INIT_ARGS.slice(8)];
    const res = spawnSync("bun", [devJs, ...twoTiers, "--keypair", keypairPath], {
      encoding: "utf8",
      cwd: cliRoot,
    });
    expect(res.status).not.toBe(0);
    expect(res.stderr).toContain("3 --tier");
  });
});

describe("hanse:join --dry-run", () => {
  test("snapshot: premium = tier index 2; member + depositor PDAs bound to wallet", () => {
    const run = dryRun([
      "hanse:join",
      "--mutual",
      mutualPda,
      "--tier",
      "premium",
      "--pool",
      POOL_OVERRIDE,
      "--deposit-mint",
      DEPOSIT_MINT,
    ]);
    const decoded = getJoinInstructionDataDecoder().decode(decodeHex(run.data));
    expect(decoded.tier).toBe(2);

    expect(run.accounts[0]?.address).toBe(wallet); // member signer
    expect(run.accounts[1]?.address).toBe(HANSE_PROGRAM_ADDRESS); // funder slot unfilled → program id
    expect(run.accounts[2]?.address).toBe(memberAccountPda);
    expect(run.accounts[3]?.address).toBe(mutualPda);
    expect(run.accounts[4]?.address).toBe(POOL_OVERRIDE);
    expect(run.accounts[5]?.address).toBe(depositorPda);
  });

  test("sponsor: funder slot = sponsor signer, source ATA + rent = sponsor's", async () => {
    const sponsorPath = join(dirname(keypairPath), "sponsor.json");
    writeFileSync(sponsorPath, JSON.stringify(Array.from(SPONSOR_SECRET)));
    const run = dryRun([
      "hanse:join",
      "--mutual",
      mutualPda,
      "--tier",
      "standard",
      "--pool",
      POOL_OVERRIDE,
      "--deposit-mint",
      DEPOSIT_MINT,
      "--sponsor",
      sponsorPath,
    ]);
    expect(run.accounts[0]?.address).toBe(wallet); // member still signs
    expect(run.accounts[1]?.address).toBe(sponsor); // funder signer
    expect(run.accounts[1]?.role).toContain("signer");
    expect(run.accounts[6]?.address).toBe(await findAssociatedTokenAddress(DEPOSIT_MINT, sponsor)); // source ATA = sponsor's
    expect(run.accounts[7]?.address).toBe(sponsor); // rent payer = sponsor
    const decoded = getJoinInstructionDataDecoder().decode(decodeHex(run.data));
    expect(decoded.tier).toBe(1);
  });
});

describe("hanse:settle-pool --dry-run", () => {
  test("snapshot: cranker signer + mutual + treasury ATA", () => {
    const run = dryRun([
      "hanse:settle-pool",
      "--mutual",
      mutualPda,
      "--pool",
      POOL_OVERRIDE,
      "--deposit-mint",
      DEPOSIT_MINT,
    ]);
    expect(run.accounts[0]?.address).toBe(wallet);
    expect(run.accounts[0]?.role).toContain("signer");
    expect(run.accounts[1]?.address).toBe(mutualPda);
    expect(run.accounts[2]?.address).toBe(overrideTreasury);
  });
});

describe("hanse:dissolve --dry-run", () => {
  test("snapshot: ownership authority PDA + pool + treasury", () => {
    const run = dryRun([
      "hanse:dissolve",
      "--mutual",
      mutualPda,
      "--pool",
      POOL_OVERRIDE,
      "--deposit-mint",
      DEPOSIT_MINT,
    ]);
    // [0]cranker [1]mutual [2]ownershipAuthority [3]pool [4]treasury
    expect(run.accounts[2]?.address).toBe(ownershipAuthorityPda);
    expect(run.accounts[3]?.address).toBe(POOL_OVERRIDE);
    expect(run.accounts[4]?.address).toBe(overrideTreasury);
  });
});

describe("hanse:set-subaccord-param --dry-run", () => {
  test("snapshot: payload + nonce decoded; pending update PDA under accord", async () => {
    const run = dryRun([
      "hanse:set-subaccord-param",
      "--mutual",
      mutualPda,
      "--subaccord",
      subaccordPda,
      "--nonce",
      "4",
      "--payload",
      "MinStake:20000000",
    ]);
    const decoded = getSetSubaccordParamInstructionDataDecoder().decode(decodeHex(run.data));
    expect(decoded.nonce).toBe(4n);
    expect(decoded.param).toEqual({ __kind: "MinStake", fields: [20_000_000n] });

    const [pendingUpdate] = await findPendingUpdatePda({ subaccord: subaccordPda, nonce: 4n });
    expect(run.accounts[0]?.address).toBe(wallet); // authority + rent payer
    expect(run.accounts[4]?.address).toBe(pendingUpdate);
  });
});

test("file-claim without a reachable rpc errors cleanly (nonce + fee are chain state)", () => {
  const res = spawnSync(
    "bun",
    [
      devJs,
      "hanse:file-claim",
      "--mutual",
      mutualPda,
      "--amount",
      "1000",
      "--evidence",
      POLICY_HASH,
      "--keypair",
      keypairPath,
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

describe("hanse:quote (pure, offline)", () => {
  test("§8 exhausted path via the CLI, no keypair or rpc needed", () => {
    const res = spawnSync(
      "bun",
      [
        devJs,
        "hanse:quote",
        "--json",
        "--claim-amount",
        "2000000000",
        "--fee-paid",
        "15000000",
        "--treasury",
        "20000000000",
        "--obligations",
        "30000000000",
        "--fee-refunds",
        "225000000",
        "--contribution",
        "20000000",
      ],
      { encoding: "utf8", cwd: cliRoot },
    );
    expect(res.status).toBe(0);
    const out = JSON.parse(res.stdout);
    expect(out.ratio1e9).toBe("661703887"); // bigint → decimal string (jsonStringify)
    expect(out.claimPart).toBe("1323407774"); // $1,323.407774 — §8 "$1,323.40"
    expect(out.feePart).toBe("9925558"); // $9.925558 — §8 "$9.93"
    expect(out.payout).toBe("1333333332");
    expect(out.burn).toBe("20000000"); // saturates at the $20 contribution
  });
});
