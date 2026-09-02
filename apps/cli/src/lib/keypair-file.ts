import { randomBytes } from "node:crypto";
import { writeFileSync } from "node:fs";
import { join } from "node:path";

/**
 * Write a fresh, internally-consistent Solana keypair JSON file
 * (seed‖pubkey, 64 bytes — the `solana-keygen` format) into `dir` and return
 * its path.
 *
 * Test fixture: kit v7's `createKeyPairFromBytes` rejects files whose public
 * half does not match the private seed, so arbitrary bytes won't do. The
 * seed is random; the public key is derived from it via @noble/curves
 * (already in the tree through @solana/kit's dependency on it).
 */
import { ed25519 } from "@noble/curves/ed25519";

export function writeKeypairFile(dir: string): string {
  const seed = randomBytes(32);
  const secretKey = new Uint8Array(64);
  secretKey.set(seed);
  secretKey.set(ed25519.getPublicKey(seed), 32);
  const path = join(dir, "id.json");
  writeFileSync(path, JSON.stringify(Array.from(secretKey)));
  return path;
}
