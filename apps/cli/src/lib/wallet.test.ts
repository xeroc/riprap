import { mkdtempSync, rmSync, writeFileSync } from "node:fs";
import { homedir, tmpdir } from "node:os";
import { join } from "node:path";

import { afterEach, beforeEach, describe, expect, it } from "vitest";

import { writeKeypairFile } from "./keypair-file";
import { DEFAULT_KEYPAIR_PATH, defaultWsEndpoint, loadKeypair, resolveKeypairPath } from "./wallet";

const KEYPAIR_ENV_KEYS = ["RIPRAP_KEYPAIR_PATH", "ANCHOR_WALLET"] as const;
let savedEnv: Record<string, string | undefined>;

beforeEach(() => {
  savedEnv = Object.fromEntries(KEYPAIR_ENV_KEYS.map((k) => [k, process.env[k]]));
  for (const k of KEYPAIR_ENV_KEYS) delete process.env[k];
});

afterEach(() => {
  for (const k of KEYPAIR_ENV_KEYS) {
    if (savedEnv[k] === undefined) delete process.env[k];
    else process.env[k] = savedEnv[k];
  }
});

describe("resolveKeypairPath — resolution matrix (flag → RIPRAP_KEYPAIR_PATH → ANCHOR_WALLET → default)", () => {
  it("flag beats both env vars", () => {
    process.env.RIPRAP_KEYPAIR_PATH = "/env/riprap.json";
    process.env.ANCHOR_WALLET = "/env/anchor.json";
    expect(resolveKeypairPath("/flag/wallet.json")).toBe("/flag/wallet.json");
  });

  it("RIPRAP_KEYPAIR_PATH beats ANCHOR_WALLET", () => {
    process.env.RIPRAP_KEYPAIR_PATH = "/env/riprap.json";
    process.env.ANCHOR_WALLET = "/env/anchor.json";
    expect(resolveKeypairPath(undefined)).toBe("/env/riprap.json");
  });

  it("ANCHOR_WALLET is used when the riprap env is absent", () => {
    process.env.ANCHOR_WALLET = "/env/anchor.json";
    expect(resolveKeypairPath(undefined)).toBe("/env/anchor.json");
  });

  it("falls back to ~/.config/solana/id.json", () => {
    expect(resolveKeypairPath(undefined)).toBe(DEFAULT_KEYPAIR_PATH);
    expect(DEFAULT_KEYPAIR_PATH).toBe(`${homedir()}/.config/solana/id.json`);
  });

  it("expands a leading ~", () => {
    expect(resolveKeypairPath("~/.config/solana/other.json")).toBe(
      `${homedir()}/.config/solana/other.json`,
    );
  });
});

describe("loadKeypair", () => {
  it("loads a valid keypair file into a signer", async () => {
    const dir = mkdtempSync(join(tmpdir(), "riprap-wallet-"));
    try {
      const signer = await loadKeypair(writeKeypairFile(dir));
      expect(signer.address).toMatch(/^[1-9A-HJ-NP-Za-km-z]{32,44}$/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("errors on a missing file", async () => {
    await expect(loadKeypair("/nonexistent/id.json")).rejects.toThrow(/Cannot read wallet keypair/);
  });

  it("errors on invalid JSON", async () => {
    const dir = mkdtempSync(join(tmpdir(), "riprap-wallet-"));
    try {
      writeFileSync(join(dir, "bad.json"), "{not json");
      await expect(loadKeypair(join(dir, "bad.json"))).rejects.toThrow(/not valid JSON/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });

  it("errors on a wrong-length byte array", async () => {
    const dir = mkdtempSync(join(tmpdir(), "riprap-wallet-"));
    try {
      writeFileSync(
        join(dir, "short.json"),
        JSON.stringify(Array.from({ length: 63 }, (_, i) => i)),
      );
      await expect(loadKeypair(join(dir, "short.json"))).rejects.toThrow(/exactly 64 uint8 bytes/);
    } finally {
      rmSync(dir, { recursive: true, force: true });
    }
  });
});

describe("defaultWsEndpoint", () => {
  it("mirrors the local validator port pair 8899 → 8900", () => {
    expect(defaultWsEndpoint("http://127.0.0.1:8899")).toBe("ws://127.0.0.1:8900");
  });

  it("swaps the scheme on remote https endpoints", () => {
    expect(defaultWsEndpoint("https://api.devnet.solana.com")).toBe("wss://api.devnet.solana.com");
  });

  it("leaves an explicit ws endpoint untouched", () => {
    expect(defaultWsEndpoint("wss://rpc.example.com:8901")).toBe("wss://rpc.example.com:8901");
  });
});
