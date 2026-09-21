// The derivation is pinned to HANSE_DOMAIN_SPEC_UPLOAD.md §4's worked vector
// (computed against Rust `subaccord_domain_ref`) — this test is the TS↔Rust
// byte-compatibility proof for the whole upload path.
import { describe, expect, it } from "vitest";

import { domainRefHex, hansePreimage, sha256Hex, toHex } from "./domainRef";

const DOC = new TextEncoder().encode("# Hanse Cover Terms\n\nPilot v1 mutual cover terms.\n");
const POLICY_HASH = "d5756c2e6ec42a9a557da82b0ac7000a7c0e613f997fb822407c7a43801172b4";
const PREIMAGE_HEX =
  "68616e73653a7375626163636f72640100000000000000" +
  "d5756c2e6ec42a9a557da82b0ac7000a7c0e613f997fb822407c7a43801172b4";
const DOMAIN_REF = "f76adcdd011256053753e5f5c9a4f73bca8645fdb8b566ef8c3a431085ec686e";

function bytes32(hex: string): Uint8Array {
  const out = new Uint8Array(32);
  for (let i = 0; i < 32; i++) out[i] = Number.parseInt(hex.slice(i * 2, i * 2 + 2), 16);
  return out;
}

describe("hanse domain_ref derivation (HANSE_DOMAIN_SPEC_UPLOAD §4, seed = 1)", () => {
  it("sha256(doc) is the policy_hash", async () => {
    expect(await sha256Hex(DOC)).toBe(POLICY_HASH);
  });

  it("preimage is utf8('hanse:subaccord') ‖ seed.le64 ‖ policy_hash — 55 bytes", () => {
    expect(toHex(hansePreimage(1n, bytes32(POLICY_HASH)))).toBe(PREIMAGE_HEX);
    expect(hansePreimage(1n, bytes32(POLICY_HASH)).length).toBe(55);
  });

  it("sha256(preimage) is the domain_ref", async () => {
    expect(await domainRefHex(1n, bytes32(POLICY_HASH))).toBe(DOMAIN_REF);
  });

  it("seed serializes little-endian u64 (0 and max)", () => {
    const zero = hansePreimage(0n, bytes32(POLICY_HASH)).slice(15, 23);
    expect(toHex(zero)).toBe("0000000000000000");
    const max = hansePreimage(0xffffffffffffffffn, bytes32(POLICY_HASH)).slice(15, 23);
    expect(toHex(max)).toBe("ffffffffffffffff");
  });
});
