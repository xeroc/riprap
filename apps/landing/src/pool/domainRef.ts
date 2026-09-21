// The Hanse → Accord domain derivation, byte-exact mirror of
// `subaccord_domain_ref(seed, policy_hash)` in programs/hanse (initialize_mutual.rs)
// per HANSE_DOMAIN_SPEC_UPLOAD.md §1. The evidence daemon is
// derivation-agnostic: WE compute the preimage and prove the binding.
//
//   policy_hash = sha256(cover_terms_bytes)            // == Mutual.policyHash
//   preimage    = utf8("hanse:subaccord") ‖ seed.le64 ‖ policy_hash   (55 bytes)
//   domain_ref  = sha256(preimage)                     // == Subaccord.domain_ref

/** lowercase hex */
export function toHex(bytes: ArrayLike<number>): string {
  let hex = "";
  for (let i = 0; i < bytes.length; i++) hex += bytes[i].toString(16).padStart(2, "0");
  return hex;
}

/** WebCrypto sha256 as lowercase hex — browsers + node ≥19 share `crypto.subtle`. */
export async function sha256Hex(bytes: ArrayLike<number>): Promise<string> {
  const digest = await crypto.subtle.digest("SHA-256", bytes as unknown as BufferSource);
  return toHex(new Uint8Array(digest));
}

/** utf8("hanse:subaccord") ‖ seed_le64 ‖ policy_hash — exactly 55 bytes. */
export function hansePreimage(seed: bigint, policyHash: ArrayLike<number>): Uint8Array {
  const prefix = new TextEncoder().encode("hanse:subaccord"); // 15 bytes
  if (policyHash.length !== 32)
    throw new Error(`policy_hash must be 32 bytes, got ${policyHash.length}`);
  const preimage = new Uint8Array(prefix.length + 8 + 32);
  preimage.set(prefix, 0);
  // seed as u64 little-endian
  let s = seed;
  for (let i = 0; i < 8; i++) {
    preimage[prefix.length + i] = Number(s & 0xffn);
    s >>= 8n;
  }
  preimage.set(policyHash, prefix.length + 8);
  return preimage;
}

/** sha256(preimage) as lowercase hex — the Subaccord's on-chain `domain_ref`. */
export async function domainRefHex(seed: bigint, policyHash: ArrayLike<number>): Promise<string> {
  return sha256Hex(hansePreimage(seed, policyHash));
}
