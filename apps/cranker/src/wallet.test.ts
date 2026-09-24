import { mkdtempSync, writeFileSync } from "node:fs";
import { tmpdir } from "node:os";
import { join } from "node:path";

import { ed25519 } from "@noble/curves/ed25519";
import { type Lamports, lamports, type Rpc, type SolanaRpcApi } from "@solana/kit";
import { describe, expect, test } from "vitest";

import { loadCrankerWallet, MIN_CRANKER_FUND_LAMPORTS } from "./wallet.js";

function keypairFile(bytes: number[]): string {
  const dir = mkdtempSync(join(tmpdir(), "cranker-wallet-"));
  writeFileSync(join(dir, "id.json"), JSON.stringify(bytes));
  return join(dir, "id.json");
}

function rpcWithBalance(value: Lamports): Rpc<SolanaRpcApi> {
  return {
    getBalance: (_address: never) => ({ send: async () => ({ value }) }),
  } as unknown as Rpc<SolanaRpcApi>;
}

/** A real 64-byte solana keypair: 32 seed + 32 public key (solana-keygen layout). */
function validKeypair(): number[] {
  const seed = new Uint8Array(32).fill(0xab);
  return [...seed, ...ed25519.getPublicKey(seed)];
}

describe("loadCrankerWallet", () => {
  test("missing env var fails loud", async () => {
    await expect(loadCrankerWallet({}, rpcWithBalance(MIN_CRANKER_FUND_LAMPORTS))).rejects.toThrow(
      /RIPRAP_CRANKER_KEYPAIR/,
    );
  });

  test("unreadable file fails with the path in the message", async () => {
    await expect(
      loadCrankerWallet(
        { RIPRAP_CRANKER_KEYPAIR: "/nonexistent/id.json" },
        rpcWithBalance(MIN_CRANKER_FUND_LAMPORTS),
      ),
    ).rejects.toThrow(/\/nonexistent\/id\.json/);
  });

  test("wrong-length keypair JSON is rejected", async () => {
    await expect(
      loadCrankerWallet(
        { RIPRAP_CRANKER_KEYPAIR: keypairFile([1, 2, 3]) },
        rpcWithBalance(MIN_CRANKER_FUND_LAMPORTS),
      ),
    ).rejects.toThrow(/exactly 64 uint8 bytes/);
  });
  test("underfunded keypair fails at boot, not mid-loop", async () => {
    await expect(
      loadCrankerWallet(
        { RIPRAP_CRANKER_KEYPAIR: keypairFile(validKeypair()) },
        rpcWithBalance(lamports(MIN_CRANKER_FUND_LAMPORTS - 1n)),
      ),
    ).rejects.toThrow(/underfunded/);
  });

  test("funded keypair loads as signer + address", async () => {
    const wallet = await loadCrankerWallet(
      { RIPRAP_CRANKER_KEYPAIR: keypairFile(validKeypair()) },
      rpcWithBalance(MIN_CRANKER_FUND_LAMPORTS),
    );
    expect(wallet.signer.address).toBe(wallet.address);
    expect(wallet.balanceLamports).toBe(MIN_CRANKER_FUND_LAMPORTS);
  });
});
